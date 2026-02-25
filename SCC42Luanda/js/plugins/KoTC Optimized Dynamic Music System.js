
/*:
 * @target MZ
 * @plugindesc v1 Allows one to have a Dynamic Music System
 * for their game, allowing multiple songs per map.
 * @Author Knight of the Celestial Developer Team.
 *
 *
 * @command EnableKoTCDynamicMusic
 * @desc Enables Dynamic Music System, interupting the
 * current BGM if one is active.
 * @text Enable Dynamic Music
 *
 *
 * @command DisableKoTCDynamicMusic
 * @desc Disables the Dynamic Music System, interupting the
 * current BGM if one is active.
 * @text Disable Dynamic Music
 *
 *
 *
 *
 *
 * @help
 * Allows one to have a playlist of songs that is reusable
 * for multiple maps, and designated through the map notes.
 * 
 * If you add a music list with the name Plains then you would
 * use this map note to designate a map that plays a random
 * song from that music list upon entry.
 * For example:
 * 
 * <KoTC Music List: Plains>
 * 
 * 
 *
 * Plugin Command: EnableKoTCDynamicMusic
 * Script Call: EnableKoTCDynamicMusic();
 * 
 * Interupts the current BGM if one is active, and if the map
 * has a designated music list, begins to play music from it.
 * 
 * 
 * 
 * Plugin Command: DisableKoTCDynamicMusic
 * Script Call: DisableKoTCDynamicMusic();
 *
 * Interupts the current BGM if one is active, and prevents
 * dynamic music from activating until enabled.
 *
 *
 *
 *
 * @param Music List Config
 * @desc Configure what maps have what view distance.
 * @parent Map Settings
 * @default []
 * @type struct<KoTCDynamicMusicSettings>[]
 *
 *
 */
/*~struct~KoTCDynamicMusicSettings:
 * @param List Name
 * @desc Name of list for usage in notetags. Use a single word.
 * Example: Mountains1, Desert, Houses, Plains
 * @type string
 *
 * @param Music Contained
 * @desc Names of music the list contains.
 * @parent Map Settings
 * @default []
 * @type struct<KoTCMusicData>[]
 *
 */
/*~struct~KoTCMusicData:
 * @param Music Name
 * @desc Case sensitive, name of song file without extension.
 * Example: Combat1
 * @type string
 *
 * @param Music Pitch
 * @default 100
 * @type number
 * 
 * @param Music Volume
 * @default 100
 * @type number
 * 
 * @param Fadeout Time
 * @desc Seconds to fadeout song after song is done playing.
 * Or after all loops are finished playing.
 * @default 5
 * @type number
 * 
 * @param Music Loop Amount
 * @desc Amount of times to repeat the song before the next.
 * @default 0
 * @type number
 * 
 * @param Music Pitch Variance
 * @desc Amount the pitch can vary from the set value.
 * Example: 100 pitch with 20 variance is 80-120 pitch.
 * @default 0
 * @type number
 */

(function () {
    var KOTCDynamicMusicINIT = Game_System.prototype.initialize;
    Game_System.prototype.initialize = function () {
        KOTCDynamicMusicINIT.call(this); // Makes sure to do the stuff that was in the function before
        $KoTCDynamicMusicSystem = {
            Parameters: PluginManager.parameters('KoTC Optimized Dynamic Music System'),
            NextSongReadyToPlay: 0,
            MusicPool: {},
            RegExMusicCode: new RegExp(/<KoTC Music List: (\S+)>/i)

        };
        
    var mainparse = JSON.parse($KoTCDynamicMusicSystem.Parameters['Music List Config']);
    var g = 0;
    var length = mainparse.length;
    for (; g < length; g++) {
        var listparse = JSON.parse(mainparse);
        var listname = listparse["List Name"];
        $KoTCDynamicMusicSystem.MusicPool[listname] = JSON.parse(listparse["Music Contained"]);
        var length2 = $KoTCDynamicMusicSystem.MusicPool[listname].length;
        var p = 0;
        for (;p < length2; p++){
            $KoTCDynamicMusicSystem.MusicPool[listname][p] = JSON.parse($KoTCDynamicMusicSystem.MusicPool[listname][p]);
        }
    }









            if (Utils.RPGMAKER_NAME == "MZ") {
                PluginManager.registerCommand('KoTC Optimized Dynamic Music System', "EnableKoTCDynamicMusic", data => {
                        EnableKoTCDynamicMusic();
                });
                PluginManager.registerCommand('KoTC Optimized Dynamic Music System', "DisableKoTCDynamicMusic", data => {
                        DisableKoTCDynamicMusic();
                });

            } else {
                var kotcmapplugin = Game_Interpreter.prototype.pluginCommand;
                Game_Interpreter.prototype.pluginCommand = function (command, args) {
                    kotcmapplugin.call(this, command, args);
                    if (command.includes("KoTCDynamicMusic")){
                    switch (command) {
                    case 'EnableKoTCDynamicMusic':
                        EnableKoTCDynamicMusic();
                        break;
                    case 'DisableKoTCDynamicMusic':
                        DisableKoTCDynamicMusic();
                        break;

                    default:

                    };
                }
                };

            };
    }
}
    ())


var KOTCDynamicMusicTransfer = Game_Player.prototype.performTransfer;
Game_Player.prototype.performTransfer = function () {
        $KoTCDynamicMusicSystem.NextSongReadyToPlay = 1;
    KOTCDynamicMusicTransfer.call(this);


}


var KOTCWayDynMusTransCompleted = Scene_Map.prototype.onMapLoaded;
Scene_Map.prototype.onMapLoaded = function () {
    KOTCWayDynMusTransCompleted.call(this);
    if ($KoTCDynamicMusicSystem.RegExMusicCode.exec($dataMap.note) !== null && typeof $KoTCDynamicMusicSystem.DynamicMusicDisabled == 'undefined') {
        setTimeout(() => {
        KoTCDynamicMusic()
            
        }, 100);

    } else {
                AudioManager.stopBgm()
                clearTimeout($KoTCDynamicMusicSystem.NextSongTimeout);
                clearTimeout($KoTCDynamicMusicSystem.NextSongTimeout2);
                clearTimeout($KoTCDynamicMusicSystem.NextSongTimeout3);

    }

};

function DisableKoTCDynamicMusic(){
    $KoTCDynamicMusicSystem.DynamicMusicDisabled = 1;
                AudioManager.stopBgm()
                clearTimeout($KoTCDynamicMusicSystem.NextSongTimeout);
                clearTimeout($KoTCDynamicMusicSystem.NextSongTimeout2);
                clearTimeout($KoTCDynamicMusicSystem.NextSongTimeout3);

}

function EnableKoTCDynamicMusic(){
    $KoTCDynamicMusicSystem.DynamicMusicDisabled = undefined;
                AudioManager.stopBgm();
                KoTCDynamicMusic(1)

}


function KoTCDynamicMusic(forceplay, musiclistname) {
    if (typeof $KoTCDynamicMusicSystem.DynamicMusicDisabled == 'undefined' && $KoTCDynamicMusicSystem.RegExMusicCode.exec($dataMap.note) !== null || typeof forceplay !== 'undefined' && typeof $KoTCDynamicMusicSystem.DynamicMusicDisabled == 'undefined' && $KoTCDynamicMusicSystem.RegExMusicCode.exec($dataMap.note) !== null || typeof $KoTCDynamicMusicSystem.DynamicMusicDisabled == 'undefined'  && typeof musiclistname !== 'undefined') {

        if ($KoTCDynamicMusicSystem.PreviousMusicList !== $KoTCDynamicMusicSystem.CurrentMusicList || $KoTCDynamicMusicSystem.NextSongReadyToPlay !== undefined || typeof forceplay !== 'undefined') {
            if ($KoTCDynamicMusicSystem.NextSongReadyToPlay !== undefined) {
                $KoTCDynamicMusicSystem.NextSongReadyToPlay = undefined;
            } else {
                AudioManager.stopBgm()
                clearTimeout($KoTCDynamicMusicSystem.NextSongTimeout);
                clearTimeout($KoTCDynamicMusicSystem.NextSongTimeout2);
                clearTimeout($KoTCDynamicMusicSystem.NextSongTimeout3);
            };
            if (typeof forceplay !== 'undefined'){
                AudioManager.stopBgm()
                clearTimeout($KoTCDynamicMusicSystem.NextSongTimeout);
                clearTimeout($KoTCDynamicMusicSystem.NextSongTimeout2);
                clearTimeout($KoTCDynamicMusicSystem.NextSongTimeout3);

            }
            if (typeof musiclistname !== 'undefined'){
            $KoTCDynamicMusicSystem.CurrentMusicList = musiclistname;
            AudioManager.stopBgm()
                clearTimeout($KoTCDynamicMusicSystem.NextSongTimeout);
                clearTimeout($KoTCDynamicMusicSystem.NextSongTimeout2);
                clearTimeout($KoTCDynamicMusicSystem.NextSongTimeout3);
                var musictarget = $KoTCDynamicMusicSystem.MusicPool[musiclistname][Math.randomInt($KoTCDynamicMusicSystem.MusicPool[musiclistname].length)];

            } else {
                AudioManager.stopBgm()
            $KoTCDynamicMusicSystem.CurrentMusicList = RegExp.$1;
                var musictarget = $KoTCDynamicMusicSystem.MusicPool[RegExp.$1][Math.randomInt($KoTCDynamicMusicSystem.MusicPool[RegExp.$1].length)];

            }
            if (musictarget["Music Pitch Variance"] > 0){
               var pitchvarianceaddition = (Math.random() * (Number(musictarget["Music Pitch Variance"]) * 2));
            } else {
                var pitchvarianceaddition = 0;
            }
            console.log(musictarget["Music Name"]);
                var timestoplay = musictarget["Music Loop Amount"] + 1;
            AudioManager.playBgm({
                name: musictarget["Music Name"],
                volume: musictarget["Music Volume"],
                pitch: Number(musictarget["Music Pitch"]) - Number(musictarget["Music Pitch Variance"]) + pitchvarianceaddition,
                pan: 0
            });
            
            $KoTCDynamicMusicSystem.PreviousMusicList = $KoTCDynamicMusicSystem.CurrentMusicList;
            $KoTCDynamicMusicSystem.NextSongTimeout3 = setTimeout(function () {
                var timetonextsong = Math.round(AudioManager._bgmBuffer._totalTime * (Number(musictarget["Music Pitch"]) - Number(musictarget["Music Pitch Variance"]) + pitchvarianceaddition / 100) * timestoplay * 1000);
                console.log(timetonextsong);
                $KoTCDynamicMusicSystem.NextSongTimeout = setTimeout(function () {
                    $KoTCDynamicMusicSystem.NextSongReadyToPlay = 1;
                    KoTCDynamicMusic();
                }, timetonextsong)
                $KoTCDynamicMusicSystem.NextSongTimeout2 = setTimeout(function () {
                    AudioManager.fadeOutBgm(Number(musictarget["Fadeout Time"]))
                }, timetonextsong - (Number(musictarget["Fadeout Time"]) * 1000))
            }, 1000);
        };
    };
};
