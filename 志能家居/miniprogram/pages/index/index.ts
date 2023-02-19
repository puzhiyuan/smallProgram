// index.ts
// 获取应用实例
const app = getApp<IAppOption>()
var mqtt = require('../../utils/mqtt.min.js')
var client = null
Page({
  data: {
    currentValue: 0,
    subTopic: "testtopic/1",//小程序订阅
    pubTopic: "testtopic/2",//esp订阅
    city: "...",//城市
    area: "...",//地区
    id: "...",//城市id（和风天气请求参数）
    textDay: "...",//当前天气
    tempNow: "...",//当前温度
    category: "...",//
    weatherIndex: "...",//天气指数
    location: "...",//地区
    LED: "false",//LED状态
  },

  // 事件处理函数
  bindViewTap() {

  },
  onLoad() {
    this.getWeather(),
    this.connectMqtt()
  },
  //获取天气相关信息
  getWeather() {
    var that = this
    //发起请求获取城市id
    wx.request({
      url: 'https://geoapi.qweather.com/v2/city/lookup',
      data: {
        location: '田家庵',
        key: '19753a29cecf4bbfa8a9740faacad312'
      },
      header: {
        'content-type': 'application/json' // 默认值
      },
      method: "GET",
      success(res) {
        that.setData({
          id: res.data.location[0].id,
          city: res.data.location[0].adm2,
          area: res.data.location[0].name
        })
        that.setData({
          location: that.data.city + "-" + that.data.area
        })
        //获取天气
        wx.request({
          url: 'https://devapi.qweather.com/v7/weather/now',
          data: {
            location: res.data.location[0].id,
            key: '19753a29cecf4bbfa8a9740faacad312'
          },
          header: {
            'content-type': 'application/json' // 默认值
          },
          method: "GET",
          success(res) {
            that.setData({
              textDay: res.data.now.text,
              tempNow: res.data.now.temp + "℃"
            })
          }
        })
        //获取天气质量
        wx.request({
          url: 'https://devapi.qweather.com/v7/air/now',
          data: {
            location: res.data.location[0].id,
            key: '19753a29cecf4bbfa8a9740faacad312'
          },
          header: {
            'content-type': 'application/json' // 默认值
          },
          method: "GET",
          success(res) {
            that.setData({
              category: "空气质量-" + res.data.now.category
            })
          }
        })
        //获取天气指数
        wx.request({
          url: 'https://devapi.qweather.com/v7/indices/1d',
          data: {
            type: 1,
            location: res.data.location[0].id,
            key: '19753a29cecf4bbfa8a9740faacad312'
          },
          header: {
            'content-type': 'application/json' // 默认值
          },
          method: "GET",
          success(res) {
            that.setData({
              weatherIndex: res.data.daily[0].text
            })
          }
        })
      }
    })
 

  },
  //获取设备状态
  //设置LED状态
  setLED(event){
    var that = this
    console.log(event.detail)
    let oledStatus = event.detail.value
    if(oledStatus){
      client.publish(that.data.pubTopic, '{"target": "LED", "value": 1}', function(err){
        if(!err){
          console.log("发送成功--开")
        }
      })
    }else{
      client.publish(that.data.pubTopic, '{"target": "LED", "value": 0}',function(err){
        if(!err){
          console.log("发送成功--关")
        }
      })
    }
    
  },

  //连接MQTT服务器
  connectMqtt() {
    var that = this
    const options = {


      clientId: 'mqttjs_' + Math.random().toString(16).substr(2, 8),
      client: true,
      connectTimeout: 4000,
      username: 'pzy',
      password: '666777',
      keepalive: 60


      // connectTimeout: 4000,
      // clientId: 'emqx_cloud9e0294',
      // // port: 8084, 
      // username: 'pzy',
      // password: '666777',
    }

    client = mqtt.connect('wxs://cdd3910c.ala.cn-hangzhou.emqxsl.cn:8084/mqtt', options)
    client.on('reconnect', (error) => {
      console.log('正在重连:', error)
      client.end()
    })

    client.on('error', (error) => {
      console.log('连接失败:', error)
      client.end()
    })
    
    client.on('connect', (e) => {
      console.log('成功连接服务器,开始订阅' + that.data.subTopic)
      client.subscribe(that.data.subTopic, { qos: 0 }, function (err) {
        if (!err) {
          client.publish(that.data.pubTopic,'login success')
          console.log('订阅成功')
        }
      })
    });
    client.on('message', function (topic, message) {
      console.log('收到订阅主题' + that.data.subTopic + ':' + message.toString())
    })
  },
})
