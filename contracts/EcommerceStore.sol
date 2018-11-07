pragma solidity ^0.4.0;

contract EcommerceStore {
    struct Product {
        //
        uint id;    //产品id
        string name;    //商品名称
        string category;    //类别
        string imageLink;   //图片hash
        string descLink;    //描述文件哈希

        uint startPrice;    //起始价
        uint auctionStartTime;  //开始时间
        uint auctionEndTime;    //结束时间
        uint highestBid;    //最高出价
        uint totalBids; //竞表标数量
        address highestBidder;  //最高其出价人
        uint secondHighestBid;  //次高价
        ProductStatus status;  //产品销售状态
        ProductCondition condition; //产品状态
        mapping(address => mapping(bytes32 => Bid)) bids;
    }

    enum ProductStatus {Open, Sold, Unsold}
    enum ProductCondition {Used, New}

    uint public productIndex;

    constructor()public{
        productIndex = 0;
    }

    //用来维护商品id与卖家的map
    mapping(uint => address) public productIdToOwner;
    //商家上架的商品集合
    mapping(address => mapping(uint => Product)) stores;

    function addProductToStore(string _name, string _category, string _imageLink, string _descLink, uint _startPrice, uint _startTime, uint _endTime, uint condition) public {
        productIndex++;
        Product memory product = Product({
            id : productIndex,
            name : _name,
            category : _category,
            imageLink : _imageLink,
            descLink : _descLink,
            startPrice : _startPrice,
            auctionStartTime : _startTime,
            auctionEndTime : _endTime,
            highestBigger : 0,
            highestBig : 0,
            totalBigs : 0,
            secondHighestBig : 0,
            status : ProductStatus.Open,
            condition : ProductCondition(condition)
            });

        stores[msg.sender][productIndex] = product;
        productIdToOwner[productIndex] = msg.sender;
    }

    function getProductById(uint _productId) public view returns (uint, string, string, string, string, uint, uint, uint, uint){
        address owner = productIdToOwner[_productId];
        Product memory product = stores[owner][_productId];
        return (product.id, product.name, product.category, product.imageLink, product.descLink, product.auctionStartTime, product.auctionEndTime, product.startPrice, uint(product.status));
    }


    //竞标的结构
    struct Bid {
        uint productId;
        uint price;
        bool isRevealed;
        address bidder;
    }

    //竞标函数
    function bid(uint _productId, bytes32 _bidHash) public payable {
        //找到商品
        Product storage product = stores[productIdToOwner[_productId]][_productId];
        //竞拍总人数加一
        product.totalBids++;
        //构建竞标结构体
        Bid memory bidLocal = Bid(_productId, msg.value, false, msg.sender);
        //添加
        product.bids[msg.sender][_bidHash] = bidLocal;
    }

    //生成哈希函数
    function makeBidHash(string _realAmount, string _secret) public pure returns (bytes32){
        return sha3(_realAmount, _secret);
    }

    //返回竞标
    function getBidById(uint _productId, byte32 _bidId) public view returns (uint, uint, bool, address){
        Product storage product = stores[productIdToOwner[_productId]][_productId];

        Bid memory bid = product.bids[msg.sender][_bidId];

        return (bid.productId, bid.price, bid.isRevealed, bid.bidder);
    }

    //返回当前金额
    function getBalance() public view returns (uint){
        return this.balance;
    }

    event revealEvent(uint productid, bytes32 bidId, uint idealPrice, uint price, uint refund);

    function revealBid(uint _productId, string _ideaPrice, string _secret) public {
        Product storage product = stores[productIdToOwner[_productId]][_productId];
        bytes32 bidId = sha3(_ideaPrice, _secret);

        //一个人可以对同一个商品竞标多次，揭标的时候也要揭标多次
        Bid storage currBid = product.bids[msg.sender][bidId];

        require(now > product.auctionStartTime);
        require(!currBid.isRevealed);
        require(currBid.bidder > 0);

        currBid.isRevealed = true;

        //bid中的是迷惑价格，真实价格揭标时传递进来
        uint confusePrice = currBid.price;

        uint refund = 0;
        uint idealPrice = stringToUint(_ideaPrice);
        if (confusePrice < idealPrice) {
            //路径1：无效交易
            refund = confusePrice;
        } else {
            if (idealPrice > product.highestBid) {
                if (product.highestBidder == 0) {
                    //当前账户是第一个揭标人
                    //路径2：
                    product.highestBidder = msg.sender;
                    //当前账户是最高价揭标人
                    product.highestBid = idealPrice;
                    //最高价是心理价
                    product.secondHighestBid = product.startPrice;
                    //次高价是起始价
                    refund = confusePrice - idealPrice;
                    //退款为差价
                } else {
                    //路径3：不是第一个，但出价目前最高，更新最高竞标人，最高价，次高价
                    product.highestBidder.transfer(product.highestBid);
                    //前最高价竞标人退款
                    product.secondHighestBid = product.highestBid;
                    //更新次高价
                    product.highestBid = idealPrice;
                    //更新最高价
                    product.highestBidder = msg.sender;
                    //退款给最高价竞标人
                    refund = confusePrice - idealPrice;
                }
            } else {
                //路径4：价格低于最高价，但是高于次高价
                if (idealPrice > product.secondHighestBid) {
                    //更新次高价，那会自己的钱
                    product.secondHighestBid = idealPrice;
                    refund = confusePrice;
                } else {
                    //路径5：路人甲，价格低于次高价，直接退款
                    refund = confusePrice;
                }
            }
        }

        emit revealEvent(_productId, bidId, confusePrice, currBid.price, refund);

        if (refund > 0) {
            msg.sender.transfer(refund);
        }
    }

    //转换函数
    function stringToUint(string s) private pure returns (uint){
        bytes memory b = bytes(s);
        uint result = 0;
        for (uint i = 0; i < b.length; i++) {
            if (b[i] >= 48 && b[i] <= 57) {
                result = result * 10 + (uint(b[i]) - 48);
            }
        }
        return result;
    }

    //返回当前最高竞标信息
    function getHighestBidInfo(uint _productId) public view returns (address, uint, uint){
        Product memory product = stores[productIdToOwner[_productId]][_productId];
        return (product.highestBidder, product.highestBid, product.secondHighestBid);
    }

    mapping(uint => address)public productToEscrow;

    function finalizeAuction(uint _productId) public {
        Product storage product = stores[productIdToOwner[_productId]][_productId];
        address buyer = product.highestBidder;
        //指定买家地址
        address seller = productIdToOwner[_productId];
        //指定卖家地址
        address arbiter = msg.sender;
        //指定仲裁人
        require(arbiter != buyer && arbiter != seller);
        require(now > product.auctionEndTime);

        require(product.status == ProductStatus.Open);


        if(product.totalBids == 0){
            product.status = ProductStatus.Unsold;
        }else{
            product.status = ProductStatus.Sold;
        }

        //.value（）进行外部调用时转钱
        address escrow = (new Escrow).value(product.secondHighestBid)(buyer,seller,arbiter);
        productToEscrow[_productId] = escrow;
        buyer.transfer(product.highestBid - product.secondHighestBid);
    }
}

contract Escrow{
    //买家
    address buyer;
    //卖家
    address seller;
    //仲裁人
    address arbiter;

    constructor(address _buyer,address _seller,address _arbiter)public payable {
        buyer = _buyer;
        seller = _seller;
        arbiter = _arbiter;
    }


}
