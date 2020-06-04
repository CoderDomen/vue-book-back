const express = require("express");
const mysql = require("mysql");
const cors = require("cors");
const constant = require("./const");


const app = express();

app.use(cors());
// 数据库连接
function connect() {
  return mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "1108",
    database: "book"
  });
}

// 接收请求向数据库发起查询，并将数据以json返回前端


function randomArray(n, l) {
  const rnd = [];
  for (let i = 0; i < n; i++) {
    rnd.push(Math.floor(Math.random() * l));
  }
  return rnd;
}

function createData(results, key) {
  return handleData(results[key]);
}

function handleData(data) {
  if (!data.cover.startsWith("http://")) {
    data["cover"] = `${constant.resUrl}/img${data.cover}`;
  }
  data["selected"] = false;
  data["private"] = false;
  data["cache"] = false;
  data["haveRead"] = 0;
  return data;
}

function createGuessYouLike(data) {
  const n = parseInt(randomArray(1, 3)) + 1;
  data["type"] = n;
  switch (n) {
    case 1:
      data["result"] =
        data.id === 2 ? "《Executing Magic》" : "《Elements of Robotics》";
      break;
    case 2:
      data["result"] =
        data.id === 2
          ? "《Improving Psychiatric Care》"
          : "《Programming Languages》";
      break;
    case 3:
      data["result"] = "《Living with Disfiguremeng》";
      data["percent"] = data.id === 2 ? "92%" : "97%";
      break;
  }
  return data;
}

function createRecommend(data) {
  data["readers"] = Math.floor((data.id / 2) * randomArray(1, 100));
  return data;
}

function createCategoryIds(n) {
  const arr = [];
  constant.category.forEach((item, index) => {
    arr.push(index + 1);
  });
  const result = [];
  for (let i = 0; i < n; i++) {
    // 获取的随机数不能重复
    const ran = Math.floor(Math.random() * (arr.length - i));
    // 获取分类对应的序号
    result.push(arr[ran]);
    // 将已经获取的随机数取代，用最后一位数
    arr[ran] = arr[arr.length - i - 1];
  }
  return result;
}

function createCategoryData(data) {
  const categoryIds = createCategoryIds(6);
  const result = [];
  categoryIds.forEach(categoryId => {
    const subList = data
      .filter(item => item.category === categoryId)
      .slice(0, 4);
    subList.map(item => {
      return handleData(item);
    });
    result.push({
      category: categoryId,
      list: subList
    });
  });
  return result.filter(item => item.list.length === 4);
}

app.get("/book/home", (req, res) => {
  const conn = connect();
  conn.query("select *  from book where cover != ''", (err, results) => {
    const length = results.length;
    const banner = `${constant.resUrl}/home_banner2.jpg`;
    const guessYouLike = [];
    const recommend = [];
    const featured = [];
    const random = [];
    const categoryList = createCategoryData(results);
    const categories = constant.categories;
    randomArray(9, length).forEach(key => {
      guessYouLike.push(createGuessYouLike(createData(results, key)));
    });
    randomArray(3, length).forEach(key => {
      recommend.push(createRecommend(createData(results, key)));
    });
    randomArray(6, length).forEach(key => {
      featured.push(createData(results, key));
    });
    randomArray(1, length).forEach(key => {
      random.push(createData(results, key));
    });
    res.json({
      banner,
      guessYouLike,
      recommend,
      featured,
      categoryList,
      categories,
      random
    });
    conn.end();
  });
});

app.get("/book/detail", (req, res) => {
  const conn = connect();
  const fileName = req.query.fileName;
  const sql = `select *  from book where fileName='${fileName}'`;
  conn.query(sql, (err, results) => {
    if (err) {
      res.json({
        error_code: 1,
        msg: "电子书获取详情失败"
      });
    } else {
      if (results && results.length === 0) {
        res.json({
          error_code: 1,
          msg: "电子书获取详情失败"
        });
      } else {
        const book = handleData(results[0]);
        res.json({
          error_code: 0,
          msg: "获取成功",
          data: book
        });
      }
    }
    conn.end();
  });
});

app.get('/book/flat-list',(req,res)=>{
  const conn = connect();
  conn.query("select * from book where cover !=''",(err,results)=>{
    if (err) {
      res.json({
        error_code: 1,
        msg: "获取失败"
      });
    } else{
      results.forEach(item=>handleData(item))
      res.json({
        error_code:0,
        msg:'获取成功',
        data:results,
        total:results.length
      })
    }
  
    conn.end();

  })
})
app.get('/book/list',(req,res)=>{
  const conn = connect();
  conn.query("select * from book where cover !=''",(err,results)=>{
    if (err) {
      res.json({
        error_code: 1,
        msg: "获取失败"
      });
    } else{
      results.map(item=>handleData(item))
      const data = {}
      constant.category.forEach(categoryText=>{
        data[categoryText] = results.filter(item=>item.categoryText === categoryText)
      })
      res.json({
        error_code:0,
        msg:'获取成功',
        data:data,
        total:results.length
      })
    }
  
    conn.end();

  })
})
app.get('/book/shelf',(req,res)=>{
  res.json({
    bookList:[]
  })
})




const server = app.listen(3000, () => {
  const host = server.address().address
  const port = server.address().port

  console.log('server is listening at http://%s:%s', host, port)
})


