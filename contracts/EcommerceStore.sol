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

}
