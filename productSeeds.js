EcommerceStore = artifacts.require('./EcommerceStore.sol')

module.exports = function (callback) {
    current_time = Math.round(new Date() / 1000)
    amt_1 = web3.toWei(1, 'ether')
    EcommerceStore.deployed().then(function (i) { i.addProductToStore('天梭男111', '手表', 'QmSczQesJLCFdEzp7r2eqNk6hSo7Hru6MAQd1Z9DKE12pd', 'QmXJoRj1ZiZHgUHBjSA4ciXsognYGTviYNL3c8CudNaP9N', current_time, current_time + 70, 2 * amt_1, 0).then(function (f) { console.log(f) }) })
    console.log('11111')
    EcommerceStore.deployed().then(function(i) {i.addProductToStore('天梭男222', '手表', 'QmSczQesJLCFdEzp7r2eqNk6hSo7Hru6MAQd1Z9DKE12pd', 'QmXJoRj1ZiZHgUHBjSA4ciXsognYGTviYNL3c8CudNaP9N', current_time, current_time + 10000, 3*amt_1, 1).then(function(f) {console.log(f)})})
    console.log('22222')
    EcommerceStore.deployed().then(function(i) {i.addProductToStore('天梭女333', '手表', 'QmSczQesJLCFdEzp7r2eqNk6hSo7Hru6MAQd1Z9DKE12pd', 'QmXJoRj1ZiZHgUHBjSA4ciXsognYGTviYNL3c8CudNaP9N', current_time, current_time + 1000, amt_1, 0).then(function(f) {console.log(f)})})
    EcommerceStore.deployed().then(function(i) {i.addProductToStore('天梭男444', '手表', 'QmSczQesJLCFdEzp7r2eqNk6hSo7Hru6MAQd1Z9DKE12pd', 'QmXJoRj1ZiZHgUHBjSA4ciXsognYGTviYNL3c8CudNaP9N', current_time, current_time + 86400, 4*amt_1, 1).then(function(f) {console.log(f)})})
    EcommerceStore.deployed().then(function(i) {i.productIndex.call().then(function(f){console.log(f)})})
}