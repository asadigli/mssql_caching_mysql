global.sql = require('mssql')
const sqlConfig = {
        user: process.env.REMOTE_SERVER_USR,
        password: process.env.REMOTE_SERVER_PWD,
        // database: process.env.REMOTE_SERVER_DB,
        server: process.env.REMOTE_SERVER_HOST,
        port: parseInt(process.env.REMOTE_SERVER_PORT),
        pool: {
          max: 10,
          min: 0,
          idleTimeoutMillis: 30000
        },
        requestTimeout: 120000,
        options: {
          encrypt: true,
          trustServerCertificate: true
        }
}
sql.on('error', err => {
  logger.add(err)
});

global.sql_connect = sql.connect(sqlConfig);

global.mysql = require('mysql')
const mysqlConfig = {
        user: process.env.LOCAL_SERVER_USR,
        password: process.env.LOCAL_SERVER_PWD,
        database: process.env.LOCAL_SERVER_DB,
        host: process.env.LOCAL_SERVER_HOST,
        port: parseInt(process.env.LOCAL_SERVER_PORT),
}


global.mysql_connect = mysql.createPool(mysqlConfig);
global.mysql_connect.on('connection', function (connection) {
  console.log('DB Connection established');

  connection.on('error', function (err) {
    console.error(new Date(), 'MySQL error', err.code);
  });

  connection.on('close', function (err) {
    console.error(new Date(), 'MySQL close', err);
  });

});

setInterval(function () {
  mysql_connect.query('SELECT 1');
}, 5000);
