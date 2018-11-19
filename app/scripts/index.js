// Import the page's CSS. Webpack will know what to do with it.
import '../styles/app.css'
// Import libraries we need.
import { default as Web3 } from 'web3'
import { default as contract } from 'truffle-contract'
// Import our contract artifacts and turn them into usable abstractions.
import ecommerceStore from '../../build/contracts/EcommerceStore.json'
import $ from 'jquery'
import ipfsAPI from 'ipfs-api'
import ethUtil from 'ethereumjs-util'

const ipfs = ipfsAPI({
  ip: 'localhost',
  port: '5001',
  protocol: 'http'
})

// MetaCoin is our usable abstraction, which we'll use through the code below.
const ecommerceStoreContract = contract(ecommerceStore)
let ecommerceStoreInstance

const App = {
  start: function () {
    console.log('Hello')
    ecommerceStoreContract.setProvider(window.web3.currentProvider)
    console.log('11111')
    ecommerceStoreContract.deployed().then(i => {
      ecommerceStoreInstance = i
      renderProducts()

      if ($('#product-details').length > 0) {
        // 注意不是个函数
        // ?id=2
        // 1. 通过url得到产品id
        let id = getProductId()

        // 2. 通过id得到产品详情 //call()方式
        renderProductDetail(id)
      } // product-details
      $('#bidding').submit(function (event) {
        // 1. 理想出价
        let bidAmount = $('#bid-amount').val()
        // 2. 迷惑价格
        let bidSend = $('#bid-send-amount').val()
        // 3. 秘密字符串
        let secretText = $('#secret-text').val()
        // let secretText = 'xxx'
        // 4. 产品id
        let productId = $('#product-id').val()

        let bidHash = '0x' + ethUtil.keccak256(window.web3.toWei(bidAmount, 'ether') + secretText).toString('hex')
        ecommerceStoreInstance.bid(parseInt(productId), bidHash, {
          from:window.web3.eth.accounts[0],
          value: window.web3.toWei(bidSend, 'ether')
        }).then(result => {
          console.log('bid result:', result)
          location.reload(true)
        }).catch(e => {
          console.log('bid err:', e)
        })
        event.preventDefault()
      }) // bidding submit

      $('#revealing').submit(function (event) {
        let actualAmount = $('#actual-amount').val()
        let secretText = $('#reveal-secret-text').val()
        let productId = $('#product-id').val()
        ecommerceStoreInstance.makeBidHash(web3.toWei(actualAmount, 'ether'), secretText).then(res => {
          console.log('makeBidHash : ', res)
        })

        // function revealBid(uint _productId, uint _idealPrice, string _secret) public {
        // toWei返回string，不是int
        ecommerceStoreInstance.revealBid(parseInt(productId), web3.toWei(actualAmount, 'ether'), secretText, {
          from: web3.eth.accounts[0]
        }).then(result => {
          console.log('revealBid successfully : ', result)
          location.reload(true)
        }).catch(e => {
          console.log('revealBid failed : ', e)
        })
        // 防止form跳转
        event.preventDefault()
      }) // revealing

      $('#finalize-auction').submit(function (event) {
        console.log()
        let productId = $('#product-id').val()
        // function finalizeAuction(uint _productId) public {
        ecommerceStoreInstance.finalizeAuction(parseInt(productId), {
          from: web3.eth.accounts[0]
        }).then(result => {
          alert('The auction has been finalize and winner declared.')
          location.reload(true)
          console.log('finlize-auction successfully : ', result)
        }).catch(e => {
          alert('The auction has been finalize and winner declared.')
          console.log('finalize-auction failed : ', e)
        })
        event.preventDefault()
      }) // finalize-auction

      // 1. 向卖家付款：
      //    1. 获取产品id
      //    2. 调用giveToSeller方法
      $('#release-funds').click(function (event) {
        let id = getProductId()
        ecommerceStoreInstance.giveToSeller(id, {
          from: window.web3.eth.accounts[0]
        }).then(result => {
          alert('向卖家投票成功!')
          location.reload(true)
        }).catch(e => {
          alert('向卖家投票失败!')
        })
        event.preventDefault()
      }) // #release-funds

      // 2. 向买家退款：
      //    1. 获取产品id
      //    2. 调用giveToBuyer方法
      $('#refund-funds').click(function (event) {
        let id = getProductId()
        ecommerceStoreInstance.giveToBuyer(id, {
          from: window.web3.eth.accounts[0]
        }).then(result => {
          alert('向买家投票成功!')
          location.reload(true)
        }).catch(e => {
          alert('向买家投票失败!')
        })
        event.preventDefault()
      }) // refund-funds
    })
  }
}

window.App = App

window.addEventListener('load', function () {
  // Checking if Web3 has been injected by the browser (Mist/MetaMask)
  if (typeof web3 !== 'undefined') {
    console.warn(
      'Using web3 detected from external source.' +
            ' If you find that your accounts don\'t appear or you have 0 MetaCoin,' +
            ' ensure you\'ve configured that source properly.' +
            ' If using MetaMask, see the following link.' +
            ' Feel free to delete this warning. :)' +
            ' http://truffleframework.com/tutorials/truffle-and-metamask'
    )
    // Use Mist/MetaMask's provider
    window.web3 = new Web3(web3.currentProvider)
  } else {
    console.warn(
      'No web3 detected. Falling back to http://127.0.0.1:9545.' +
            ' You should remove this fallback when you deploy live, as it\'s inherently insecure.' +
            ' Consider switching to Metamask for development.' +
            ' More info here: http://truffleframework.com/tutorials/truffle-and-metamask'
    )
    // fallback - use your fallback strategy (local node / hosted node + in-dapp id mgmt / fail)
    window.web3 = new Web3(new Web3.providers.HttpProvider('http://127.0.0.1:9545'))
  }

  App.start()
})

function renderProducts () {
  // 1. 获取所有的产品数量
  ecommerceStoreInstance.productIndex().then(productIndex => {
    console.log('222222')
    // 注意！！
    for (let i = 1; i <= productIndex; i++) {
      // 2. 获取每个产品的信息
      ecommerceStoreInstance.getProductById(i).then(productInfo => {
        let {
          0: id, 1: name, 2: category, 3: imageLink, 4: descLink, 5: auctionStartTime,
          6: auctionEndTime, 7: startPrice, 8: status
        } = productInfo
        // 3. 每个产品创建一个node，填充数据，
        console.table(productInfo)
        let node = $('<div/>')
        node.append(`<img src="http://localhost:8080/ipfs/${imageLink}" width="150px"/>`)
        // 名字
        node.append(`<div>${name}</div>`)
        // 类别
        node.append(`<div>${category}</div>`)
        // 竞拍起始时间
        let startT = new Date(auctionStartTime * 1000)
        node.append(`<div>${startT}</div>`)
        // 竞拍结束时间
        let endT = new Date(auctionEndTime * 1000)
        node.append(`<div>${endT}</div>`)
        // 竞拍起始价格
        // 注意！！！
        // 旧版本：web3.fromWei
        // 新版本：web3.utils.fromWei(number [, unit])
        let price = window.web3.fromWei(startPrice, 'ether')
        node.append(`<div>${price}</div>`)
        // 按钮detail
        node.append(`<a href="product.html?id=${id.c[0]}">Details</a>`)

        // 4.组合append到id="product-list中
        $('#product-list').append(node)
      })
    }
  })
}

// 解析url得到商品id
function getProductId () {
  console.log('search:', window.location.search)
  let urlParams = new URLSearchParams(window.location.search)
  let id = urlParams.get('id')
  console.log('id:', id)
  return id
}

function renderProductDetail (id) {
  ecommerceStoreInstance.getProductById(id).then(productInfo => {
    let {
      0: id, 1: name, 2: category, 3: imageLink, 4: descLink, 5: auctionStartTime,
      6: auctionEndTime, 7: startPrice, 8: status
    } = productInfo
    console.log(productInfo)
    $('#product-image').append(`<img src="http://localhost:8080/ipfs/${imageLink}" width="150px"/>`)

    let content = ''
    // 先不用stream事件，直接使用字符串拼接
    ipfs.cat(descLink).then(file => {
      content += file.toString()
      $('#product-desc').append(`<div>${content}</div>`)
    })

    // 1. 起始价格
    $('#product-price').text(displayPrice(startPrice))
    // 2. 竞拍倒计时（竞拍剩余时间，揭标剩余时间）duke 几个时间显示函数需要看一下
    $('#product-auction-end').text(displayEndHours(auctionEndTime))
    // 3. 产品的名称
    $('#product-name').text(name)
    // 4. 保存product-id到这个页面，后面的标签会使用到  duke
    $('#product-id').val(id)
    $('#bidding, #revealing, #finalize-auction, #escrow-info').hide()
    let currentTime = getCurrentTimeInSeconds()

    // 产品竞标情况status ： 0--> 进行中  1---> 卖掉  2---> 没卖掉
    // 从这里入手！！
    if (parseInt(status) === 0) {
      console.log('status === 0')
      // Open：还在竞标中，已经揭标
      // 1. 竞标阶段
      // 1. 只显示竞标的表单
      // 2. 揭标阶段
      // 1. 只显示揭标表单
      // 2. 隐藏竞标表单
      if (currentTime < parseInt(auctionEndTime)) {
        // 竞标阶段
        $('#bidding').show()
      } else if (currentTime < parseInt(auctionEndTime) + 36) {
        // 揭标阶段
        $('#revealing').show()
      } else {
        // 仲裁阶段
        $('#finalize-auction').show()
      }
    } else if (parseInt(status) === 1) {
      console.log('status === 1')
      // Sold：卖了，执行了finazlie
      //
      // 1. 执行finalize
      // 1. 只显示finalize按钮
      // 2. 隐藏竞标表单
      // 3. 隐藏揭标表单
      // 4. 显示当前中标的信息（第三方合约信息：买家，卖家，仲裁人，投票情况）
      $('#escrow-info').show()
      let finalPrice
      ecommerceStoreInstance.getHighestBidInfo.call(id).then(info => {
        const { 0: highestBidder, 1: highestBid, 2: secondBid } = info
        finalPrice = secondBid
        $('#product-status').html(`<p>产品状态：揭标已结束，最高价：${displayPrice(highestBid)}, 开始进入仲裁投票阶段!</p>`)
      })

      ecommerceStoreInstance.getEscrowInfo.call(id).then(escroInfo => {
        console.log('escroInfo:', escroInfo)
        // return (buyer, seller, arbiter, buyerVotesCount, sellerVotesCount);
        const { 0: buyer, 1: seller, 2: arbiter, 3: buyerVotesCount, 4: sellerVotesCount } = escroInfo
        $('#buyer').html(`<p>买家：${buyer}</p>`)
        $('#seller').html(`<p>卖家：${seller}</p>`)
        $('#arbiter').html(`<p>仲裁：${arbiter}</p>`)

        if (parseInt(buyerVotesCount) === 2) {
          $('#refund-count').html(`<p>商品未成交，已退款给买家!`)
          $('#product-status').html(`<p>产品状态：拍卖已结束!</p>`)
        } else if (parseInt(sellerVotesCount) === 2) {
          $('#release-count').html(`<p>商品成交，已付款给卖家, 成交价：${web3.fromWei(finalPrice, 'ether')} ETH`)
          $('#product-status').html(`<p>产品状态：拍卖已结束</p>`)
        } else {
          $('#refund-count').html(`<p>买家获得: ${buyerVotesCount}/3 票`)
          $('#release-count').html(`<p>卖家获得: ${sellerVotesCount}/3 票`)
        }
      })
      //
    } else if (parseInt(status) === 2) {
      console.log('status === 2')
      // Unsold：没卖掉，自始至终没有竞标（或者是有人竞标但是没人揭标，竞标人损失钱，卖家也得不到）
      //
      // 1. 执行finalize发现没人竞标
      $('#product-status').html(`<p>产品状态：拍卖结束，未卖出</p>`)
    }
  })
}

function displayPrice (price) {
  return window.web3.fromWei(price, 'ether') + 'ETH'
}

function getCurrentTimeInSeconds () {
  return Math.round(new Date() / 1000)
}

function displayEndHours (seconds) {
  let currentTime = getCurrentTimeInSeconds()
  let remainingSeconds = seconds - currentTime

  if (remainingSeconds <= 0) {
    return 'Auction has ended'
  }

  let days = Math.trunc(remainingSeconds / (24 * 60 * 60))

  remainingSeconds -= days * 24 * 60 * 60
  let hours = Math.trunc(remainingSeconds / (60 * 60))

  remainingSeconds -= hours * 60 * 60

  let minutes = Math.trunc(remainingSeconds / 60)

  if (days > 0) {
    return 'Auction ends in ' + days + ' days, ' + hours + ', hours, ' + minutes + ' minutes'
  } else if (hours > 0) {
    return 'Auction ends in ' + hours + ' hours, ' + minutes + ' minutes '
  } else if (minutes > 0) {
    return 'Auction ends in ' + minutes + ' minutes '
  } else {
    return 'Auction ends in ' + remainingSeconds + ' seconds'
  }
}

