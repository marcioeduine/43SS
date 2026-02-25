// Plugin: FullscreenPicture

var Imported = Imported || {};
Imported.FullscreenPicture = true;

var FullscreenPicture = {};

FullscreenPicture.Parameters = PluginManager.parameters('FullscreenPicture');
FullscreenPicture.EnableFullscreen = FullscreenPicture.Parameters['Enable Fullscreen'] === 'true';
FullscreenPicture.MaintainAspectRatio = FullscreenPicture.Parameters['Maintain Aspect Ratio'] === 'true';

// Función para escalar una imagen a pantalla completa
FullscreenPicture.ShowPicture = function(pictureId, x, y, w, h, sx, sy, opacity, blendMode, scale) {
  var bitmap = $gameScreen.picture(pictureId).bitmap;
  var width = Graphics.width;
  var height = Graphics.height;
  var scaleX = width / bitmap.width;
  var scaleY = height / bitmap.height;
  if (FullscreenPicture.MaintainAspectRatio) {
    if (scaleX > scaleY) {
      scaleY = scaleX;
    } else {
      scaleX = scaleY;
    }
  }
  var scaledWidth = bitmap.width * scaleX;
  var scaledHeight = bitmap.height * scaleY;
  var dx = (width - scaledWidth) / 2;
  var dy = (height - scaledHeight) / 2;
  $gameScreen.showPicture(pictureId, x + dx, y + dy, scaledWidth, scaledHeight, sx, sy, opacity, blendMode);
};

// Reemplazar la función ShowPicture original
Game_Interpreter.prototype.showPicture = function(pictureId, x, y, w, h, sx, sy, opacity, blendMode, scale) {
  if (FullscreenPicture.EnableFullscreen) {
    FullscreenPicture.ShowPicture(pictureId, x, y, w, h, sx, sy, opacity, blendMode, scale);
  } else {
    // Función original de ShowPicture
    $gameScreen.showPicture(pictureId, x, y, w, h, sx, sy, opacity, blendMode);
  }
};
