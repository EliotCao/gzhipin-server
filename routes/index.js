var express = require('express');
var router = express.Router();

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
router.post('/register',function (req,res){
  //1.获取请求
  const {username,password} = req.body;
  //2.处理
  if (username==='admin'){
    res.send({code: 1, msg: '此用户已存在'});
  }else {
    res.send({code: 0, data: {id: 'abc',username, password}});
  }
  //3.返回响应数据
})

module.exports = router;
