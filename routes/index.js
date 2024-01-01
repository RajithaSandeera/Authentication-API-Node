// import express from "express";
// import routes from "./routes.js";

// const app = express();
// const PORT = 3000;
// app.use(express.json());
// app.use(routes);
var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

// app.use((err, req, res, next) => {
//   err.statusCode = err.statusCode || 500;
//   err.message = err.message || "Internal Server Error";
//   res.status(err.statusCode).json({
//       message: err.message,
//   });
// });

// app.listen(PORT, () => console.log(`Server is running on port ${PORT}`));
// module.exports = router;
