'use strict';

const fs = require('fs');
const request = require('request');

const Line = function(token) {
  this.token = token;
};

Line.prototype.postImage = function(message, path) {
  const headers = {
    "Authorization" : `Bearer ${this.token}`,
  };
  const formData = {
    message: message,
    imageFile: fs.createReadStream(path)
  }
  const options = {
    url: "https://notify-api.line.me/api/notify",
    headers: headers,
    formData: formData,
  }
  request.post(options,function(error,response,body){});
};

module.exports = Line;
