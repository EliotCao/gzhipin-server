var express = require('express');
var router = express.Router();

const md5 = require('blueimp-md5');
const {UserModel,ChatModel} = require('../db/models');
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
        // 生成一个cookie(userid: user._id), 并交给浏览器保存
        res.cookie('userid',user._id,{maxAge:1000*60*60*24});
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
      // 生成一个cookie(userid: user._id), 并交给浏览器保存
      res.cookie('userid', user._id, {maxAge: 1000*60*60*24})
      res.send({code:0,data:user});
    }else {
      res.send({code:1,msg:'用户名或密码不正确'});
    }
  })
})

//更新用户信息的路由
router.post('/update', function (req,res){
  //从请求的cookie中得到userid
  const userId = req.cookies.userid;
  if (!userId){
    //如果不存在，直接返回一个提示信息
    return res.send({code:1,msg:'请先登录'});
  }
  // 存在, 根据userid更新对应的user文档数据
  //得到用户提交数据
  const user = req.body;//没用_id
  UserModel.findByIdAndUpdate({_id:userId}, user,function (error,oldUser){
    if (!oldUser){
      //通知浏览器删除userid cookie
      res.clearCookie('userid');
      // 返回返回一个提示信息
      res.send({code:1,msd:'请先登录'})
    } else {
      // 准备一个返回的user数据对象
      const {_id,username,type} = oldUser;
      const data = Object.assign({_id, username, type},user);
      // 返回
      res.send({code:0, data});
    }
  })
})

//获取用户信息的路由
router.get('/user',function (req,res){
  const userid = req.cookies.userid;
  if (!userid){
    return res.send({code:1,msg:'请先登录'})
  }
  UserModel.findOne({_id:userid}, filter, function (error,user){
    if(user) {
      res.send({code: 0, data: user})
    } else {
      // 通知浏览器删除userid cookie
      res.clearCookie('userid')
      res.send({code: 1, msg: '请先登陆'})
    }
  })
})

//获取用户列表(根据类型)
router.get('/userlist',function (req,res){
  const {type} = req.query;
  UserModel.find({type},filter,function (error, users){
    res.send({code:0, data:users});
  })
})


/*
获取当前用户所有相关聊天信息列表
 */
router.get('/msglist', function (req, res) {
  // 获取cookie中的userid
  const userid = req.cookies.userid
  // 查询得到所有user文档数组
  UserModel.find(function (err, userDocs) {
    // 用对象存储所有user信息: key为user的_id, val为name和header组成的user对象
    /*const users = {} // 对象容器
    userDocs.forEach(doc => {
      users[doc._id] = {username: doc.username, header: doc.header}
    })*/

    const users = userDocs.reduce((users, user) => {
      users[user._id] = {username: user.username, header: user.header}
      return users
    } , {})
    /*
    查询userid相关的所有聊天信息
     参数1: 查询条件
     参数2: 过滤条件
     参数3: 回调函数
    */
    ChatModel.find({'$or': [{from: userid}, {to: userid}]}, filter, function (err, chatMsgs) {
      // 返回包含所有用户和当前用户相关的所有聊天消息的数据
      res.send({code: 0, data: {users, chatMsgs}})
    })
  })
})

/*
修改指定消息为已读
 */
router.post('/readmsg', function (req, res) {
  // 得到请求中的from和to
  const from = req.body.from
  const to = req.cookies.userid
  /*
  更新数据库中的chat数据
  参数1: 查询条件
  参数2: 更新为指定的数据对象
  参数3: 是否1次更新多条, 默认只更新一条
  参数4: 更新完成的回调函数
   */
  ChatModel.update({from, to, read: false}, {read: true}, {multi: true}, function (err, doc) {
    console.log('/readmsg', doc)
    res.send({code: 0, data: doc.nModified}) // 更新的数量
  })
})

module.exports = router;
