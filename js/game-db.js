"use strict";
exports.__esModule = true;
module.paths.push('js');
var Nedb = require("nedb");
var Path = require("path");
function writeGameLog(gameLog) {
    var db = new Nedb({ filename: Path.join(nw.App.dataPath, 'game-logs.db') });
    db.loadDatabase();
    db.insert(gameLog);
}
exports.writeGameLog = writeGameLog;
