const cheerio = require("cheerio");
const fs = require('fs');
const path = require('path');
var superagent = require('superagent');
require('superagent-proxy')(superagent);
const proxy = process.env.http_proxy || 'http://127.0.0.1:1085';
const voiceFolder = path.resolve('D:\\Download\\Voice');
const option = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/64.0.3282.140 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8",
    "Accept-Encoding": "gzip, deflate",
    "Accept-Language": "zh-CN,zh;q=0.9"
};


renameFilesInDir(voiceFolder);

function getHtml(url, callback) {
    superagent
        .get(url)
        .set(option)
        // .proxy(proxy)
        .end(callback);
}

function changeFolderName(oldFolderName, folderDir, rjCode) {
    getHtml(`http://www.dlsite.com/maniax/work/=/product_id/${rjCode}.html`, function (err, res) {
        if (err) {
            //do something
            console.log("error:"+res);
        } else {
            //do something
            console.log(`http://www.dlsite.com/maniax/work/=/product_id/${rjCode}.html`);
            // console.log(res.text);
            var $ = cheerio.load(res.text);
            if (res.text) {
                var work_info = {};
                work_info.title = $("#work_name").text().replace(/[\r\n:\?]/g,"").replace(/[【『(].*?[】』)]/g,"");
                work_info.circle = $("span.maker_name").text().replace(/[\r\n]/g,"");
                var table_outline = $("table#work_outline tr");
                for (var i = 0, ii = table_outline.length; i < ii; i++) {
                    var row = table_outline.eq(i),
                        row_text = row.text();
                        
                    switch (true) {
                        case (row_text.includes("ジャンル")):
                            var arr = row.find('a'),
                                tags = [];
                            arr.each((index, ele) =>{tags.push($(ele).text().replace("\\","."))});
                            work_info.tags = tags.join(',');
                            break;
                        case (row_text.includes("声優")):
                            var text = row.find('td').text();
                                data = text.split('/').map(function (ele) {
                                return ele.replace(/\s+/g, "");
                            }).join(',');
                            work_info.cv = data;
                            break;
                        default:
                            break;
                    }
                }
                // var newFolderName = `${rjCode} [${work_info.circle}] ${work_info.title} (${work_info.cv}){${work_info.tags}}`;
                var newFolderName = `${rjCode} [${work_info.circle}] ${work_info.title} (${work_info.cv})`;
                console.log(path.resolve(folderDir, oldFolderName));
                console.log(path.resolve(folderDir, newFolderName));
                try {
                    if(oldFolderName!=newFolderName){
                        fs.renameSync(path.resolve(folderDir, oldFolderName), path.resolve(folderDir, newFolderName));
                    }
                    console.log("done");
                } catch (error) {
                    console.log("fail");
                }
                
            }
        }
    })
}


function renameFilesInDir(dir) {
    fs.readdir(dir, function (err, files) {
        if (err) throw err;
        files.forEach(function (file) {
            var rjReg = /RJ[0-9]{6}/i,
                rjCode = rjReg.exec(file);
            if (rjCode) {
                fs.stat(path.resolve(dir, file), function (err, stats) {
                    if (err) throw err;
                    if (stats.isDirectory()) {
                        changeFolderName(file, dir, rjCode)
                    }
                });
            }
        });
    });
}