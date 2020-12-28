var express = require('express');
var router = express.Router();

const md5 = require('blueimp-md5');
const {UserModel} = require('../db/models');
const filter = {password:0,__v:0};

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

//注册一个路由：用户注册
/**
 * a）path为：/register
 * b)请求方式为：POST
 * c)接受username和password参数
 * d)admin是已注册用户
 * e)注册成功返回：{code:0,data:{_id:'abc',username:'xxxx',password:'123'}}
 * f)注册失败返回：{code:1,msg:'此用户已存在'}
 */
/*router.post('/register',function (req,res){
  //1.获取请求
  const {username,password} = req.body;
  //2.处理
  if (username==='admin'){
    res.send({code: 1, msg: '此用户已存在'});
  }else {
    res.send({code: 0, data: {id: 'abc',username, password}});
  }
  //3.返回响应数据
})*/

//注册路由
router.post('/register',function (req,res){
  const {username,password,type} = req.body;
  // 处理: 判断用户是否已经存在, 如果存在, 返回提示错误的信息, 如果不存在, 保存
  // 查询(根据username)
  UserModel.findOne({username},function (error,user){
    if (user){
      res.send({code:1,msg:'此用户已存在'});
    }else {
      new UserModel({username,password: md5(password),type}).save(function (error,user){
        res.cookie('userid',user._id,{maxAge:1000*60*24});
        const data = {username, type, _id:user._id};
        res.send({code:0, data});
      })
    }
  })
})

//登录路由
router.post('/login',function (req,res){
  const {username,password} = req.body;
  UserModel.findOne({username,password:md5(password)},filter,function (error,user){
    if (user){
      res.cookie('userid',user._id,{maxAge:1000*60*24});
      res.send({code:0,data:user});
    }else {
      res.send({code:1,msg:'用户名或密码不正确'});
    }
  })
})

module.exports = router;
