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

    function addProductToStore(string _name,string _category,string _imageLink,string _descLink,uint _startPrice,uint _startTime,uint _endTime,uint condition)public{
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

    function getProductById(uint _productId) public view returns(uint, string, string, string, string, uint, uint, uint, uint){
        address owner = productIdToOwner[_productId];
        Product memory product = stores[owner][_productId];
        return (product.id, product.name, product.category, product.imageLink, product.descLink, product.auctionStartTime, product.auctionEndTime, product.startPrice, uint(product.status));
    }


    //竞标的结构
    struct Bid{
        uint productId;
        uint price;
        bool isRevealed;
        address bidder;
    }

    //竞标函数
    function bid(uint _productId,bytes32 _bidHash)public payable{
        //找到商品
        Product storage product = stores[productIdToOwner[_productId]][_productId];
        //竞拍总人数加一
        product.totalBids++;
        //构建竞标结构体
        Bid memory bidLocal = Bid(_productId,msg.value,false,msg.sender);
        //添加
        product.bids[msg.sender][_bidHash] = bidLocal;
    }

    //生成哈希函数
    function makeBidHash(string _realAmount,string _secret)public pure returns (bytes32){
        return sha3(_realAmount,_secret);
    }

    //返回竞标
    function getBidById(uint _productId,byte32 _bidId)public view returns(uint, uint, bool, address){
        Product storage product = stores[productIdToOwner[_productId]][_productId];

        Bid memory bid = product.bids[msg.sender][_bidId];

        return (bid.productId,bid.price,bid.isRevealed,bid.bidder);
    }

    //返回当前金额
    function getBalance()public view returns (uint){
        return this.balance;
    }



}
