const express = require('express');
const path = require('path');
const { exec } = require('child_process');
const os = require('os');

const app = express();
const port = process.env.PORT || 5000;

// Serve static files from the React app
app.use(express.static(path.join(__dirname, '')));

// Handle React routing, return all requests to React app
// app.get('*',
//     function(req,
//              res) {
//     res.sendFile(path.join(__dirname, 'build', 'index.html'));
// });
app.get('/*', function (req, res, next) {
    if (!req.path.includes('api'))
        res.sendFile(path.join(__dirname, '', 'index.html'));
    else next();
});
// 获取操作系统类型
const platform = os.platform();

// 不同操作系统下的打开浏览器命令
const openCommands = {
    'darwin': 'open',
    'win32': 'start',
    'linux': 'xdg-open',
};

// 打开指定URL在默认浏览器中显示
function openBrowser(url) {
    const openCommand = openCommands[platform];
    if (openCommand) {
        exec(`${openCommand} ${url}`);
    }
}

// 在默认浏览器中打开本地服务器
// openBrowser('http://localhost:5000');
app.listen(port,(err)=>{
    if (err) {
        console.log(err);
    } else {
        openBrowser(`http://localhost:${port}`);
    }
})
