const winston = require('winston');
const md5 = require('md5');
const moment = require('moment');
const tables = require('./../configs/tables.json');


global.moment = moment;
global.md5 = md5;

global.BLOB_ZERO = '0x00000000000000000000000000000000';

global.logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  defaultMeta: { service: 'user-service' },
  transports: [
      new winston.transports.File({ filename: 'logs/' + new Date().getFullYear() + '/' +  + new Date().getMonth() +  '/error.log', level: 'error' }),
    ],
});


global.rest_response = (code, message, data) => {
    return {
      "code": code,
      "message": message,
      "data": data ?? []
    };
}


global.remote_table_name = (name) => {
   return typeof tables.remote[name] !== "undefined" ? `${process.env.REMOTE_SERVER_DB}..[${tables.remote[name]}]` : "";
 }

global.local_table_name = (name) => {
  return typeof tables.local[name] !== "undefined" ? `${process.env.LOCAL_SERVER_DB}.${tables.local[name]}` : "";
}

global.isValidDate = (value) => {
    return value instanceof Date && !isNaN(value);
}

global.isNumeric = (num) => {
  return (num > 0 || num === 0 || num === '0' || num < 0) && num !== true && isFinite(num);
}

global.addSlashes = (str) => {
  if(!str) {return "";}
  return str.replace(/'|\\'/g, "\\'");
}

global.stringify = (str) => {
  if(!str) {return "";}

  str = JSON.stringify(String(str));
  str = str.substring(1, str.length-1);
  return str;
}

global.cleaned = (str) => {
  if(!str) {return "";}
  const str_arr = str.match(/[a-zA-Z0-9]+/g);
  return str_arr && str_arr.length ? str_arr.join("") : null;
}

global.insert_dublicate_key = (table_name, insert_list) => {
  if (!table_name || !insert_list) {
    return "";
  }
  let sql_keys = [];
  let sql_values = [];
  let key_name_list = [];
  for (let key in insert_list) {
    let item = insert_list[key];
    // console.log(insert_list)
    if (!+key) {
      sql_keys = Object.keys(item);
      for (let key_name of sql_keys) {
        key_name_list.push(`\`${key_name}\` = VALUES(\`${key_name}\`)`);
      }
    }
    let sub_values = [];
    for (let item_sub of sql_keys) {
      if (item[item_sub] !== "" && item[item_sub] !== null) {
        sub_values.push(Number.isInteger(item[item_sub]) ? item[item_sub] : "'" + item[item_sub].trim() + "'");
      } else {
        sub_values.push("NULL");
      }
    }
    sql_values.push("("+sub_values.join(",")+")");
  }
  let insert_query = "(`"+sql_keys.join("`,`")+"`)";
  let values_query = sql_values.join(",");
  let key_names = key_name_list.join(",");
  return `INSERT INTO ${table_name} ${insert_query}
          VALUES ${values_query}
          ON DUPLICATE KEY
          UPDATE ${key_names}`;
}
