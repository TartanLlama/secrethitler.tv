module.paths.push('js')

import * as Nedb from 'nedb'
import * as Path from 'path'
import {GameLog} from 'game'
declare var nw: any;

export function writeGameLog(gameLog: GameLog) {
    let db = new Nedb({ filename: Path.join(nw.App.dataPath, 'game-logs.db') });
    db.loadDatabase();
    db.insert(gameLog);
}
