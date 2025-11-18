(function() {
  //---------------------------------------------------------------------
  // QR Code
  //---------------------------------------------------------------------

  var qrcode = function() {

    //---------------------------------------------------------------------
    // qrcode
    //---------------------------------------------------------------------

    /**
     * qrcode
     * @param {HTMLElement} el
     * @param {Object} voption
     * @returns el
     */
    function qrcode(el, voption) {
      this._htOption = {
        width : 256,
        height : 256,
        typeNumber : 4,
        colorDark : "#000000",
        colorLight : "#ffffff",
        hint : "",
        correctLevel : QRCode.CorrectLevel.H
      };
      if (typeof voption === 'string') {
        voption = {
          text : voption
        };
      }

      // Overwrites options
      if (voption) {
        for (var i in voption) {
          this._htOption[i] = voption[i];
        }
      }

      el = this._getCanvasWithContext(el);
      this._oContext = el.context;
      this._oCanvas = el.canvas;

      this._bIsPainted = false;
      this._android = _getAndroid();

      this._htOption.colorDark = _normalizeColor(this._htOption.colorDark);
      this._htOption.colorLight = _normalizeColor(this._htOption.colorLight);

      // If the previou module re-initializes, then new QR should be drawn.
      this._bIsPainted = false;

      this._oContext.clearRect(0, 0, this._oCanvas.width, this._oCanvas.height);
      this._oContext.fillStyle = this._htOption.colorLight;
      this._oContext.fillRect(0, 0, this._oCanvas.width, this._oCanvas.height);
      this._oContext.fillStyle = this._htOption.colorDark;

      if (this._htOption.text) {
        this.makeCode(this._htOption.text);
      }

      return el;
    }

    /**
     * Make the QR code
     * @param {String} sText
     */
    qrcode.prototype.makeCode = function (sText) {
      this._oContext.clearRect(0, 0, this._oCanvas.width, this._oCanvas.height);
      this._oContext.fillStyle = this._htOption.colorLight;
      this._oCanvas.width = this._oCanvas.height = this._htOption.width;
      this._oContext.fillRect(0, 0, this._oCanvas.width, this._oCanvas.height);
      this._oContext.fillStyle = this._htOption.colorDark;

      this._bIsPainted = false;

      var oQRCode = new QRCodeModel(_getTypeNumber(sText, this._htOption.correctLevel), this._htOption.correctLevel);
      oQRCode.addData(sText);
      oQRCode.make();

      this._bIsPainted = true;

      this._draw(oQRCode);
    };

    /**
     * Make the image from bit-bls
     * @param {QRCodeModel} oQRCode
     */
    qrcode.prototype._draw = function (oQRCode) {
      var _htOption = this._htOption;
      var _oContext = this._oContext;
      var nCount = oQRCode.getModuleCount();
      var nWidth = Math.floor(_htOption.width / nCount);
      var nHeight = Math.floor(_htOption.height / nCount);
      var nPadding = Math.floor(((_htOption.width - nWidth * nCount) / 2) / 2);
      var bIsDark = false;
      var bOddRow = false;
      var nWhiteOnBlack = (_htOption.colorDark === "#ffffff" && _htOption.colorLight === "#000000") ? true : false;

      for (var row = 0; row < nCount; row++) {
        bOddRow = (row % 2) == 1;
        bIsDark = false;

        for (var col = 0; col < nCount; col++) {
          if (oQRCode.isDark(row, col)) {
            bIsDark = true;
          } else {
            bIsDark = false;
          }

          if (nWhiteOnBlack) {
            bIsDark = !bIsDark;
          }

          _oContext.fillStyle = bIsDark ? _htOption.colorDark : _htOption.colorLight;
          _oContext.fillRect(nPadding + Math.floor((col * nWidth) + (nWidth + 1) / 2 - nWidth / 2),
                             nPadding + Math.floor((row * nHeight) + (nHeight + 1) / 2 - nHeight / 2),
                             Math.ceil(nWidth), Math.ceil(nHeight));
        }
      }

      this._hint = _htOption.hint;
      if (_htOption.hint !== "") {
        this._oContext.fillStyle = _htOption.colorDark;
        _oContext.font = "bold " + Math.floor(_htOption.width / 16) + "px arial";
        _oContext.textAlign = "center";
        _oContext.fillText(_htOption.hint, _htOption.width / 2, _htOption.height / 2 + Math.floor(_htOption.height / 4));
      }
    };

    /**
     * Get the canvas element and its context
     * @param {HTMLElement} el
     * @returns {Object} canvas and context
     */
    qrcode.prototype._getCanvasWithContext = function (el) {
      // Check the el's type and return canvas element
      if (typeof el == 'string') {
        el = document.getElementById(el);
      }

      if (!el || el.tagName != "CANVAS") {
        var canvas = document.createElement("canvas");
        el.appendChild(canvas);
        el = canvas;
      }

      var context = el.getContext("2d");
      return { canvas: el, context: context };
    };

    //---------------------------------------------------------------------
    // qrcode
    //---------------------------------------------------------------------

    return qrcode;
  }();

  //---------------------------------------------------------------------
  // QRCode for HTML
  //---------------------------------------------------------------------

  /**
   * QR Code for HTML
   * @param {String|HTMLElement} el
   * @param {Object} voption
   * @returns el
   */
  function _qrcode(el, voption) {
    var vqr = qrcode(el, voption);

    return vqr;
  }

  _qrcode.version = "1.0.0";

  //---------------------------------------------------------------------
  // QRCode
  //---------------------------------------------------------------------

  if (typeof define === 'function' && define.amd) {

    define(function() {
      return _qrcode;
    });
  } else if (typeof exports !== 'undefined') {

    if (typeof module !== 'undefined' && module.exports) {
      exports = module.exports = _qrcode;
    } else {
      exports = _qrcode;
    }

  } else {

    window.QRCode = _qrcode;
  }

  //---------------------------------------------------------------------
  // QRCode
  //---------------------------------------------------------------------

})();

(function() {
  //---------------------------------------------------------------------
  // QRCodeModel
  //---------------------------------------------------------------------

  /**
   * QRCodeModel
   * @param {Number} typeNumber 1 to 40
   * @param {Number} errorCorrectLevel @see QRCode.CorrectLevel
   */
  var QRCodeModel = function(typeNumber, errorCorrectLevel) {

    this.typeNumber = typeNumber;
    this.errorCorrectLevel = errorCorrectLevel;
    this.modules = null;
    this.moduleCount = 0;
    this.dataCache = null;
    this.dataList = [];

  };

  QRCodeModel.prototype = {

      addData : function(data) {
        var newData = new QRCode.Data(data, this.typeNumber, this.errorCorrectLevel);
        this.dataList.push(newData);
        this.dataCache = null;
      },

      isDark : function(row, col) {
        if (row < 0 || this.moduleCount <= row || col < 0 || this.moduleCount <= col) {
          return false;
        }
        return this.modules[row][col];
      },

      getModuleCount : function() {
        return this.moduleCount;
      },

      make : function() {
        this.makeImpl(false, this.getBestMaskPattern());
      },

      makeImpl : function(test, maskPattern) {

        this.moduleCount = this.typeNumber * 4 + 17;
        this.modules = new Array(this.moduleCount);

        for (var row = 0; row < this.moduleCount; row++) {

          this.modules[row] = new Array(this.moduleCount);
          for (var col = 0; col < this.moduleCount; col++) {
            this.modules[row][col] = null;
          }
        }

        this.setupPositionProbePattern(0, 0);
        this.setupPositionProbePattern(this.moduleCount - 7, 0);
        this.setupPositionProbePattern(0, this.moduleCount - 7);
        this.setupPositionAdjustPattern();
        this.setupTimingPattern();
        this.setupTypeInfo(test, maskPattern);
        if (this.typeNumber >= 7) {
          this.setupTypeNumber(test);
        }

        var data = QRCode.Util.data(this.dataList, this.typeNumber, this.errorCorrectLevel, this.moduleCount);
        this.mapData(data, maskPattern);
      },

      setupPositionProbePattern : function(row, col)  {

        for (var r = -1; r <= 7; r++) {

          if (row + r <= -1 || this.moduleCount <= row + r) continue;

          for (var c = -1; c <= 7; c++) {

            if (col + c <= -1 || this.moduleCount <= col + c) continue;

            if ( (0 <= r && r <= 6 && (c == 0 || c == 6) )
                || (0 <= c && c <= 6 && (r == 0 || r == 6))
                || (2 <= r && r <= 4 && 2 <= c && c <= 4) ) {
              this.modules[row + r][col + c] = true;
            } else {
              this.modules[row + r][col + c] = false;
            }
          }
        }
      },

      getBestMaskPattern : function() {

        var minLostPoint = 0;
        var pattern = 0;

        for (var i = 0; i < 8; i++) {

          this.makeImpl(true, i);

          var lostPoint = QRCode.Util.getLostPoint(this);

          if (i == 0 || minLostPoint > lostPoint) {
            minLostPoint = lostPoint;
            pattern = i;
          }
        }

        return pattern;
      },

      createMovieClip : function(target_mc, instance_name, depth) {

        var qr_mc = target_mc.createEmptyMovieClip(instance_name, depth);
        var cs = 1;

        this.make();

        for (var row = 0; row < this.modules.length; row++) {

          var y = row * cs;

          for (var col = 0; col < this.modules[row].length; col++) {

            var x = col * cs;
            var dark = this.modules[row][col];

            if (dark) {
              qr_mc.beginFill(0, 100);
              qr_mc.moveTo(x, y);
              qr_mc.lineTo(x + cs, y);
              qr_mc.lineTo(x + cs, y + cs);
              qr_mc.lineTo(x, y + cs);
              qr_mc.lineTo(x, y);
              qr_mc.endFill();
            }
          }
        }

        return qr_mc;
      },

      setupTimingPattern : function() {

        for (var r = 8; r < this.moduleCount - 8; r++) {
          if (this.modules[r][6] != null) {
            continue;
          }
          this.modules[r][6] = (r % 2 == 0);
        }

        for (var c = 8; c < this.moduleCount - 8; c++) {
          if (this.modules[6][c] != null) {
            continue;
          }
          this.modules[6][c] = (c % 2 == 0);
        }
      },

      setupPositionAdjustPattern : function() {

        var pos = QRCode.Util.getPatternPosition(this.typeNumber);

        for (var i = 0; i < pos.length; i++) {

          for (var j = 0; j < pos.length; j++) {

            var row = pos[i];
            var col = pos[j];

            if (this.modules[row][col] != null) {
              continue;
            }

            for (var r = -2; r <= 2; r++) {

              for (var c = -2; c <= 2; c++) {

                if (r == -2 || r == 2 || c == -2 || c == 2
                    || (r == 0 && c == 0) ) {
                  this.modules[row + r][col + c] = true;
                } else {
                  this.modules[row + r][col + c] = false;
                }
              }
            }
          }
        }
      },

      setupTypeNumber : function(test) {

        var type = QRCode.Util.getBCHTypeNumber(this.typeNumber);
        var masked = 0x00;

        for (var i = 0; i < 18; i++) {
          var bit = (type >> i) & 1;
          var mod = !(test && bit == (this.modules[Math.floor(i/3)][Math.floor(i % 3) + this.moduleCount - 8 - 1] ? 1 : 0));
          this.modules[Math.floor(i/3)][Math.floor(i % 3) + this.moduleCount - 8 - 1] = mod;
        }

        for (var i = 0; i < 18; i++) {
          var bit = (type >> i) & 1;
          var mod = !(test && bit == (this.modules[Math.floor(i % 3) + this.moduleCount - 8 - 1][Math.floor(i/3)] ? 1 : 0));
          this.modules[Math.floor(i % 3) + this.moduleCount - 8 - 1][Math.floor(i/3)] = mod;
        }
      },

      setupTypeInfo : function(test, maskPattern) {

        var data = (this.errorCorrectLevel << 3) | maskPattern;
        var masked = QRCode.Util.getBCHTypeInfo(data);

        // vertical
        for (var i = 0; i < 15; i++) {

          var mod = (!(test && ( (masked >> i) & 1)==0)) ? true : false;

          if (i < 6) {
            this.modules[i][8] = mod;
          } else if (i < 8) {
            this.modules[i + 1][8] = mod;
          } else {
            this.modules[this.moduleCount - 15 + i][8] = mod;
          }
        }

        // horizontal
        for (var i = 0; i < 15; i++) {

          var mod = (!(test && ( (masked >> i) & 1)==0)) ? true : false;

          if (i < 8) {
            this.modules[8][this.moduleCount - i - 1] = mod;
          } else if (i < 9) {
            this.modules[8][15 - i - 1 + 1] = mod;
          } else {
            this.modules[8][15 - i - 1] = mod;
          }
        }

        // fixed module
        this.modules[this.moduleCount - 8][8] = true;
      },

      mapData : function(data, maskPattern) {

        var inc = -1;
        var row = this.moduleCount - 1;
        var bitIndex = 7;
        var byteIndex = 0;

        for (var col = this.moduleCount - 1; col > 0; col -= 2) {

          if (col == 6) col--;

          while (true) {

            for (var c = 0; c < 2; c++) {

              if (this.modules[row][col - c] == null) {

                var dark = false;

                if (byteIndex < data.length) {
                  dark = ( (data[byteIndex] >>> bitIndex) & 1) == 1;
                }

                var mask = QRCode.Util.getMask(maskPattern, row, col - c);

                if (mask) {
                  dark = !dark;
                }

                this.modules[row][col - c] = dark;
                bitIndex--;

                if (bitIndex == -1) {
                  byteIndex++;
                  bitIndex = 7;
                }
              }
            }

            row += inc;

            if (row < 0 || this.moduleCount <= row) {
              row -= inc;
              inc = -inc;
              break;
            }
          }
        }
      }
  };

  QRCodeModel.RS_BLOCK_TABLE = [

    // L
    // 0 to 99
    [
      [1, 26, 19],
      [1, 26, 16],
      [1, 26, 13],
      [1, 26, 9],
      [1, 44, 34],
      [1, 70, 58],
      [2, 35, 29],
      [2, 100, 20],
      [4, 50, 26],
      [2, 50, 23],
      [4, 50, 22],
      [4, 50, 20],
      [6, 67, 32],
      [4, 67, 29],
      [8, 67, 26],
      [8, 67, 24],
      [8, 67, 22],
      [8, 67, 20],
      [10, 87, 37],
      [8, 87, 34],
      [12, 87, 31],
      [12, 87, 28],
      [16, 87, 25],
      [12, 87, 23],
      [18, 87, 21],
      [16, 87, 19],
      [20, 87, 17],
      [18, 87, 15],
      [22, 87, 13],
      [20, 87, 11],
      [24, 87, 9],
      [22, 87, 7],
      [26, 87, 5],
      [24, 87, 3],
      [28, 87, 1],
      [26, 87, 0]
    ],

    // M
    // 0 to 99
    [
      [1, 26, 26],
      [2, 44, 44],
      [2, 70, 70],
      [3, 100, 100],
      [4, 134, 134],
      [5, 172, 172],
      [6, 214, 214],
      [7, 260, 260],
      [8, 308, 308],
      [9, 358, 358],
      [10, 410, 410],
      [11, 464, 464],
      [12, 520, 520],
      [13, 578, 578],
      [14, 640, 640],
      [15, 704, 704],
      [16, 770, 770],
      [17, 838, 838],
      [18, 908, 908],
      [19, 980, 980],
      [20, 1054, 1054],
      [21, 1130, 1130],
      [22, 1208, 1208],
      [23, 1288, 1288],
      [24, 1370, 1370],
      [25, 1454, 1454],
      [26, 1540, 1540],
      [27, 1630, 1630],
      [28, 1722, 1722],
      [29, 1816, 1816],
      [30, 1914, 1914],
      [31, 2014, 2014],
      [32, 2118, 2118],
      [33, 2224, 2224],
      [34, 2332, 2332],
      [35, 2442, 2442],
      [36, 2554, 2554],
      [37, 2668, 2668],
      [38, 2784, 2784],
      [39, 2902, 2902],
      [40, 3024, 3024]
    ],

    // Q
    // 0 to 99
    [
      [1, 26, 30],
      [2, 44, 60],
      [2, 70, 90],
      [4, 100, 120],
      [4, 134, 150],
      [5, 172, 180],
      [6, 214, 210],
      [8, 260, 240],
      [8, 308, 270],
      [11, 358, 300],
      [11, 410, 330],
      [12, 464, 360],
      [16, 520, 390],
      [16, 578, 420],
      [18, 640, 450],
      [20, 704, 480],
      [22, 770, 510],
      [24, 838, 540],
      [26, 908, 570],
      [28, 980, 600],
      [30, 1054, 630],
      [32, 1130, 660],
      [34, 1208, 690],
      [36, 1288, 720],
      [38, 1370, 750],
      [40, 1454, 780],
      [42, 1540, 810],
      [44, 1630, 840],
      [46, 1722, 870],
      [48, 1816, 900],
      [50, 1914, 930],
      [52, 2014, 960],
      [54, 2118, 990],
      [56, 2224, 1020],
      [58, 2332, 1050],
      [60, 2442, 1080],
      [62, 2554, 1110],
      [64, 2668, 1140],
      [66, 2784, 1170],
      [68, 2902, 1200],
      [70, 3024, 1230]
    ],

    // H
    // 0 to 99
    [
      [1, 26, 34],
      [2, 44, 68],
      [2, 70, 102],
      [4, 100, 136],
      [4, 134, 182],
      [5, 172, 228],
      [6, 214, 274],
      [8, 260, 320],
      [8, 308, 366],
      [11, 358, 412],
      [11, 410, 458],
      [12, 464, 504],
      [16, 520, 550],
      [16, 578, 596],
      [18, 640, 642],
      [20, 704, 688],
      [22, 770, 734],
      [24, 838, 780],
      [26, 908, 826],
      [28, 980, 872],
      [30, 1054, 918],
      [32, 1130, 964],
      [34, 1208, 1010],
      [36, 1288, 1056],
      [38, 1370, 1102],
      [40, 1454, 1148],
      [42, 1540, 1194],
      [44, 1630, 1240],
      [46, 1722, 1286],
      [48, 1816, 1332],
      [50, 1914, 1378],
      [52, 2014, 1424],
      [54, 2118, 1470],
      [56, 2224, 1516],
      [58, 2332, 1562],
      [60, 2442, 1608],
      [62, 2554, 1654],
      [64, 2668, 1700],
      [66, 2784, 1746],
      [68, 2902, 1792],
      [70, 3024, 1838]
    ]
  ];

  //---------------------------------------------------------------------
  // QRCode
  //---------------------------------------------------------------------

  QRCode.CorrectLevel = {
    L : 1,
    M : 0,
    Q : 3,
    H : 2
  };

  //---------------------------------------------------------------------
  // QRCode
  //---------------------------------------------------------------------

  QRCode.Data = function(data, typeNumber, errorCorrectLevel) {

    this.typeNumber = typeNumber;
    this.errorCorrectLevel = errorCorrectLevel;
    this.data = data;
    this.parsed = false;
    this.parsedResult = null;

    this.parse();
  };

  QRCode.Data.prototype = {

    getLength : function() {
      return this.data.length;
    },

    write : function(buffer) {

      for (var i = 0; i < this.typeNumber; i++) {
        buffer.put(this.parsedResult[i], 4);
      }
    },

    getLengthInBits : function(mode) {

      switch (mode) {

        case QRCode.Mode.NUMERIC:
          return this.getLength() * 10 + Math.floor((this.getLength() - 1) / 3);

        case QRCode.Mode.ALPHANUMERIC:
          return this.getLength() * 11 + Math.floor((this.getLength() - 1) / 2);

        case QRCode.Mode.BYTE:
          return this.getLength() * 8;

        case QRCode.Mode.KANJI:
          return this.getLength() * 13;

        default:
          return 0;
      }
    },

    parse : function() {

      var result = QRCode.Util.parseData(this.data, this.typeNumber, this.errorCorrectLevel);
      this.parsedResult = result;
      this.parsed = true;
    }
  };

  //---------------------------------------------------------------------
  // QRCode
  //---------------------------------------------------------------------

  QRCode.Mode = {
    NUMERIC : 1 << 0,
    ALPHANUMERIC : 1 << 1,
    BYTE : 1 << 2,
    KANJI : 1 << 3
  };

  //---------------------------------------------------------------------
  // QRCode
  //---------------------------------------------------------------------

  QRCode.Util = {

    //---------------------------------------------------------------------
    // QRCode.Util
    //---------------------------------------------------------------------

    getBCHTypeInfo : function(data) {
      var d = data << 10;
      while (QRCode.Util.getBCHDigit(d) - QRCode.Util.getBCHDigit(data) >= 0) {
        d <<= 1;
        d |= 1;
      }
      return (d ^ data);
    },

    getBCHTypeNumber : function(data) {
      var d = data << 12;
      while (QRCode.Util.getBCHDigit(d) - QRCode.Util.getBCHDigit(data) >= 0) {
        d <<= 1;
        d |= 1;
      }
      return (d ^ data);
    },

    getBCHDigit : function(data) {

      var digit = 0;

      while (data != 0) {
        digit++;
        data >>>= 1;
      }

      return digit;
    },

    getPatternPosition : function(typeNumber) {
      return QRCode.Util.patternPosition[typeNumber - 1];
    },

    getMask : function(maskPattern, i, j) {

      switch (maskPattern) {

        case QRCode.MaskPattern.PATTERN000:
          return (i + j) % 2 == 0;
        case QRCode.MaskPattern.PATTERN001:
          return i % 2 == 0;
        case QRCode.MaskPattern.PATTERN010:
          return j % 3 == 0;
        case QRCode.MaskPattern.PATTERN011:
          return (i + j) % 3 == 0;
        case QRCode.MaskPattern.PATTERN100:
          return (Math.floor(i / 2) + Math.floor(j / 3)) % 2 == 0;
        case QRCode.MaskPattern.PATTERN101:
          return (i * j) % 2 + (i * j) % 3 == 0;
        case QRCode.MaskPattern.PATTERN110:
          return ((i * j) % 2 + (i * j) % 3) % 2 == 0;
        case QRCode.MaskPattern.PATTERN111:
          return ((i * j) % 3 + (i + j) % 2) % 2 == 0;

        default:
          throw new Error("bad maskPattern:" + maskPattern);
      }
    },

    getLostPoint : function(qrCode) {

      var moduleCount = qrCode.getModuleCount();
      var lostPoint = 0;

      // LEVEL1
      for (var row = 0; row < moduleCount; row++) {

        for (var col = 0; col < moduleCount; col++) {

          var sameCount = 0;
          var dark = qrCode.isDark(row, col);

          for (var r = -1; r <= 1; r++) {

            if (row + r < 0 || moduleCount <= row + r) {
              continue;
            }

            for (var c = -1; c <= 1; c++) {

              if (col + c < 0 || moduleCount <= col + c) {
                continue;
              }

              if (r == 0 && c == 0) {
                continue;
              }

              if (dark == qrCode.isDark(row + r, col + c)) {
                sameCount++;
              }
            }
          }

          if (sameCount > 5) {
            lostPoint += (3 + sameCount - 5);
          }
        }
      }

      for (var row = 0; row < moduleCount - 1; row++) {
        for (var col = 0; col < moduleCount - 1; col++) {
          var count = 0;
          if (qrCode.isDark(row, col)) count++;
          if (qrCode.isDark(row + 1, col)) count++;
          if (qrCode.isDark(row, col + 1)) count++;
          if (qrCode.isDark(row + 1, col + 1)) count++;
          if (count == 0 || count == 4) {
            lostPoint += 3;
          }
        }
      }

      // LEVEL3
      for (var row = 0; row < moduleCount; row++) {
        for (var col = 0; col < moduleCount - 6; col++) {
          if (qrCode.isDark(row, col)
              && !qrCode.isDark(row, col + 1)
              && qrCode.isDark(row, col + 2)
              && qrCode.isDark(row, col + 3)
              && qrCode.isDark(row, col + 4)
              && !qrCode.isDark(row, col + 5)
              && qrCode.isDark(row, col + 6)) {
            lostPoint += 40;
          }
        }
      }
      for (var col = 0; col < moduleCount; col++) {
        for (var row = 0; row < moduleCount - 6; row++) {
          if (qrCode.isDark(row, col)
              && !qrCode.isDark(row + 1, col)
              && qrCode.isDark(row + 2, col)
              && qrCode.isDark(row + 3, col)
              && qrCode.isDark(row + 4, col)
              && !qrCode.isDark(row + 5, col)
              && qrCode.isDark(row + 6, col)) {
            lostPoint += 40;
          }
        }
      }

      // LEVEL4
      var darkCount = 0;
      for (var col = 0; col < moduleCount; col++) {
        for (var row = 0; row < moduleCount; row++) {
          if (qrCode.isDark(row, col)) {
            darkCount++;
          }
        }
      }

      var ratio = Math.abs(100 * darkCount / moduleCount / moduleCount - 50) / 5;
      lostPoint += ratio * 10;

      return lostPoint;
    },

    data : function(dataList, typeNumber, errorCorrectLevel, moduleCount) {

      var rsBlocks = QRCodeModel.getRSBlocks(typeNumber, errorCorrectLevel);

      var buffer = new QRCode.BitBuffer();

      // add codewords for version information
      for (var i = 0; i < dataList.length; i++) {
        var data = dataList[i];
        buffer.put(data.mode, 4);
        buffer.put(data.getLength(), QRCode.Util.getLengthInBits(data.mode, typeNumber) );
        data.write(buffer);
      }

      // make bitstream
      var totalCodeCount = 0;
      for (var i = 0; i < rsBlocks.length; i++) {
        totalCodeCount += rsBlocks[i].totalCount;
      }

      var dataCount = totalCodeCount - buffer.getLengthInBits() / 8;
      if (dataCount < 0) {
        throw new Error("code length overflow");
      }

      // padding
      var paddingSize = dataCount - buffer.getLengthInBits() / 8;
      for (var i = 0; i < paddingSize; i++) {
        buffer.put(i&1 ? 0 : 1, 1);
      }

      var codeCount = 0;

      // error correction
      for (var b = 0; b < rsBlocks.length; b++) {
        var rsBlock = rsBlocks[b];
        var dataCount = rsBlock.dataCount;
        var totalCount = rsBlock.totalCount;
        var eccCount = totalCount - dataCount;
        var eccData = new Array();
        var rs = new QRCode.ReedSolomon(rsBlock.totalCount - rsBlock.dataCount, 0);
        var rawData = buffer.buffer.slice(codeCount, codeCount + dataCount);
        eccData = rs.encode(rawData);
        codeCount += dataCount;

        var buffer2 = new QRCode.BitBuffer();
        buffer2.put(rawData, 8 * dataCount);
        buffer2.put(eccData, 8 * eccCount);

        for (var i = 0; i < buffer2.getLengthInBits(); i += 8) {
          buffer.put(buffer2.get(i), 8);
        }
      }

      // final padding
      while (buffer.getLengthInBits() % 8 != 0) {
        buffer.put(0, 1);
      }

      // interleave
      var interleaved = new QRCode.BitBuffer();
      var capacity = totalCodeCount * 8;
      for (var i = 0; i < capacity; i++) {
        var bit = buffer.get(i);
        var shortByte = Math.floor(i / 8);
        if (shortByte % 2 == 0) {
          interleaved.put(bit, 1);
        } else {
          interleaved.put(bit, 1, capacity - 1 - shortByte);
        }
      }

      return interleaved.buffer;
    },

    getLengthInBits : function(mode, type) {

      if (1 <= type && type < 10) {

        switch(mode) {
          case QRCode.Mode.NUMERIC:  return 10;
          case QRCode.Mode.ALPHANUMERIC: return 9;
          case QRCode.Mode.BYTE: return 8;
          case QRCode.Mode.KANJI:   return 8;
          default:
            throw new Error("mode:" + mode);
        }

      } else if (type < 27) {

        switch(mode) {
          case QRCode.Mode.NUMERIC:  return 12;
          case QRCode.Mode.ALPHANUMERIC: return 11;
          case QRCode.Mode.BYTE: return 16;
          case QRCode.Mode.KANJI:   return 10;
          default:
            throw new Error("mode:" + mode);
        }

      } else if (type < 41) {

        switch(mode) {
          case QRCode.Mode.NUMERIC:  return 14;
          case QRCode.Mode.ALPHANUMERIC: return 13;
          case QRCode.Mode.BYTE: return 16;
          case QRCode.Mode.KANJI:   return 12;
          default:
            throw new Error("mode:" + mode);
        }

      } else {
        throw new Error("type:" + type);
      }
    },

    getRSBlocks : function(typeNumber, errorCorrectLevel) {

      var rsBlock = QRCodeModel.RS_BLOCK_TABLE[(typeNumber - 1)][errorCorrectLevel];
      var length = rsBlock.length / 3;

      var list = new Array();

      for (var i = 0; i < length; i++) {
        var count = rsBlock[i * 3 + 0];
        var totalCount = rsBlock[i * 3 + 1];
        var dataCount = rsBlock[i * 3 + 2];
        for (var j = 0; j < count; j++) {
          list.push(new QRCodeModel.RSBlock(totalCount, dataCount) );
        }
      }

      return list;
    },

    parseData : function(data, typeNumber, errorCorrectLevel) {

      var list = [];

      // Numeric mode
      if (QRCode.Util.isNumericMode(data)) {
        var data = data.toString();
        var length = data.length;
        for (var i = 0; i < length; i+=3) {
          var num = Number(data.substring(i, i+3));
          list.push([num, 3]);
        }
        return list;
      }

      // Alphanumeric mode
      if (QRCode.Util.isAlphanumericMode(data)) {
        var data = data.toString();
        var length = data.length;
        for (var i = 0; i < length; i+=2) {
          var num = QRCode.Util.toAlphanumericCode(data.charAt(i)) * 45 + QRCode.Util.toAlphanumericCode(data.charAt(i+1));
          list.push([num, 2]);
        }
        return list;
      }

      // Byte mode
      var data = data.toString();
      var length = data.length;
      for (var i = 0; i < length; i++) {
        var byte = data.charCodeAt(i) & 0xff;
        list.push([byte, 1]);
      }
      return list;
    },

    isNumericMode : function(data) {
      return QRCode.Regex.NUMERIC.test(data);
    },

    isAlphanumericMode : function(data) {
      return QRCode.Regex.ALPHANUMERIC.test(data.toString());
    },

    toAlphanumericCode : function(c) {
      return QRCode.Alphanumeric[c] || 0;
    },

    patternPosition : [
      [],
      [6, 18],
      [6, 22],
      [6, 26],
      [6, 30],
      [6, 34],
      [6, 22, 38],
      [6, 24, 42],
      [6, 26, 46],
      [6, 28, 50],
      [6, 30, 54],
      [6, 32, 58],
      [6, 34, 62],
      [6, 26, 46, 66],
      [6, 26, 48, 70],
      [6, 26, 50, 74],
      [6, 30, 54, 78],
      [6, 30, 56, 82],
      [6, 30, 58, 86],
      [6, 34, 62, 90],
      [6, 28, 50, 72, 94],
      [6, 26, 50, 74, 98],
      [6, 30, 54, 78, 102],
      [6, 28, 54, 80, 106],
      [6, 32, 58, 84, 110],
      [6, 30, 58, 86, 114],
      [6, 34, 62, 90, 118],
      [6, 26, 50, 74, 98, 122],
      [6, 30, 54, 78, 102, 126],
      [6, 26, 52, 78, 104, 130],
      [6, 30, 56, 82, 108, 134],
      [6, 35, 61, 87, 113, 139],
      [6, 29, 54, 80, 106, 132],
      [6, 34, 59, 85, 111, 137],
      [6, 30, 58, 84, 110, 136],
      [6, 34, 62, 88, 114, 140],
      [6, 30, 54, 80, 106, 132, 158],
      [6, 34, 59, 85, 111, 137, 163],
      [6, 30, 58, 84, 110, 136, 162],
      [6, 34, 62, 88, 114, 140, 166],
      [6, 30, 61, 86, 112, 138, 164],
      [6, 34, 59, 85, 111, 137, 163]
    ]
  };

  //---------------------------------------------------------------------
  // QRCode
  //---------------------------------------------------------------------

  QRCode.MaskPattern = {
    PATTERN000 : 0,
    PATTERN001 : 1,
    PATTERN010 : 2,
    PATTERN011 : 3,
    PATTERN100 : 4,
    PATTERN101 : 5,
    PATTERN110 : 6,
    PATTERN111 : 7
  };

  //---------------------------------------------------------------------
  // QRCode
  //---------------------------------------------------------------------

  QRCode.Regex = {
    NUMERIC : /^[0-9]+$/,
    ALPHANUMERIC : /^[0-9A-Z $%*+\-./: ]+$/
  };

  //---------------------------------------------------------------------
  // QRCode
  //---------------------------------------------------------------------

  QRCode.Alphanumeric = {
    '0' : 0,
    '1' : 1,
    '2' : 2,
    '3' : 3,
    '4' : 4,
    '5' : 5,
    '6' : 6,
    '7' : 7,
    '8' : 8,
    '9' : 9,
    'A' : 10,
    'B' : 11,
    'C' : 12,
    'D' : 13,
    'E' : 14,
    'F' : 15,
    'G' : 16,
    'H' : 17,
    'I' : 18,
    'J' : 19,
    'K' : 20,
    'L' : 21,
    'M' : 22,
    'N' : 23,
    'O' : 24,
    'P' : 25,
    'Q' : 26,
    'R' : 27,
    'S' : 28,
    'T' : 29,
    'U' : 30,
    'V' : 31,
    'W' : 32,
    'X' : 33,
    'Y' : 34,
    'Z' : 35,
    ' ' : 36,
    '$' : 37,
    '%' : 38,
    '*' : 39,
    '+' : 40,
    '-' : 41,
    '.' : 42,
    '/' : 43,
    ':' : 44
  };

  //---------------------------------------------------------------------
  // QRCode
  //---------------------------------------------------------------------

  QRCode.BitBuffer = function() {

    this.buffer = new Array();
    this.length = 0;

  };

  QRCode.BitBuffer.prototype = {

    get : function(index) {
      var bufIndex = Math.floor(index / 8);
      return ( (this.buffer[bufIndex] >>> (7 - index % 8) ) & 1) == 1;
    },

    put : function(num, length) {
      for (var i = 0; i < length; i++) {
        this.putBit( ( (num >>> (length - i - 1) ) & 1) == 1);
      }
    },

    putBit : function(bit) {

      var bufIndex = Math.floor(this.length / 8);
      if (this.buffer.length <= bufIndex) {
        this.buffer.push(0);
      }

      if (bit) {
        this.buffer[bufIndex] |= (0x80 >>> (this.length % 8) );
      }

      this.length++;
    },

    getLengthInBits : function() {
      return this.length;
    },

    getBuffer : function() {
      return this.buffer;
    }

  };

  //---------------------------------------------------------------------
  // QRCode
  //---------------------------------------------------------------------

  QRCode.ReedSolomon = function(totalCount, dataCount) {

    this.totalCount = totalCount;
    this.dataCount = dataCount;
    this.data = new Array(this.dataCount);
    this.parity = new Array(this.totalCount - this.dataCount + 1);
  };

  QRCode.ReedSolomon.prototype = {

    encode : function(data) {

      var gf = new QRCode.GFPolynomial(QRCode.Math.gexp(0), 1);
      var rs = new QRCode.GFPolynomial(0, 1);
      var i, j;

      for (i = 0; i < this.dataCount; i++) {
        this.data[i] = data[i] & 0xff;
        rs = rs.mul( new QRCode.GFPolynomial(this.data[i], 1) ).mod( this.generatorPolynomial() );
      }

      for (i = 0; i < this.totalCount - this.dataCount; i++) {
        var feedback = 0;
        if (i > 0) {
          feedback = this.parity[i - 1];
        }

        var feedbackByte = (this.dataCount > 0 ? this.data[0] : 0) ^ feedback;
        this.parity[i] = feedbackByte;

        if (this.dataCount == 0) {
          continue;
        }

        rs = rs.mul( new QRCode.GFPolynomial(feedbackByte, 1) ).mod( this.generatorPolynomial() );

        for (j = 0; j < this.dataCount - 1; j++) {
          this.data[j] = this.data[j + 1];
        }

        this.data[this.dataCount - 1] = feedbackByte;
      }

      return this.parity;
    },

    generatorPolynomial : function() {

      var gf = new QRCode.GFPolynomial(QRCode.Math.gexp(0), 1);
      var i;

      for (i = 0; i < this.totalCount - this.dataCount; i++) {
        gf = gf.mul( new QRCode.GFPolynomial(QRCode.Math.gexp(i), 1) );
      }

      return gf;
    }

  };

  //---------------------------------------------------------------------
  // QRCode
  //---------------------------------------------------------------------

  QRCode.GFPolynomial = function(num, exp) {

    this.num = num;
    this.exp = exp;
  };

  QRCode.GFPolynomial.prototype = {

    toString : function() {

      var s = "";
      if (this.num == 0) {
        return "0";
      }

      while (this.num > 0) {
        s += this.num & 1 ? "1" : "0";
        this.num >>= 1;
      }

      return s;
    },

    mul : function(other) {

      var num = 0;
      for (var i = 0; i < 8; i++) {
        if ( (other.num >>> (7 - i) ) & 1 == 1) {
          num ^= this.num << i;
        }
      }

      var exp = this.exp + other.exp;
      while (num >= 0x100) {
        num ^= 0x11d * (num >>> 8);
        exp++;
      }

      return new QRCode.GFPolynomial(num, exp);
    },

    mod : function(other) {

      if (this.num >= other.num) {
        var num = (this.num % other.num) << 8 | (this.num / other.num);
        var exp = this.exp - other.exp;
        while (num >= 0x100) {
          num ^= 0x11d * (num >>> 8);
          exp++;
        }
        return new QRCode.GFPolynomial(num, exp);
      }

      return this;
    }

  };

  //---------------------------------------------------------------------
  // QRCode
  //---------------------------------------------------------------------

  QRCode.Math = {

    glog : function(n) {

      if (n < 1) {
        throw new Error("glog(" + n + ")");
      }

      while (QRCode.Math.LOG_TABLE[n] == 0) {
        n += 255;
      }

      return QRCode.Math.LOG_TABLE[n];
    },

    gexp : function(n) {

      while (n < 0) {
        n += 255;
      }

      return QRCode.Math.EXP_TABLE[n % 255];
    },

    LOG_TABLE : new Array(256),
    EXP_TABLE : new Array(256)

  };

  for (var i = 0; i < 8; i++) {
    QRCode.Math.EXP_TABLE[i] = 1 << i;
  }
  for (var i = 8; i < 256; i++) {
    QRCode.Math.EXP_TABLE[i] = QRCode.Math.EXP_TABLE[i - 4]
        ^ QRCode.Math.EXP_TABLE[i - 5]
        ^ QRCode.Math.EXP_TABLE[i - 6]
        ^ QRCode.Math.EXP_TABLE[i - 8];
  }
  for (var i = 0; i < 255; i++) {
    QRCode.Math.LOG_TABLE[QRCode.Math.EXP_TABLE[i] ] = i;
  }

  //---------------------------------------------------------------------
  // QRCode
  //---------------------------------------------------------------------

  QRCode.RSBlock = function(totalCount, dataCount) {

    this.totalCount = totalCount;
    this.dataCount = dataCount;
  };

  QRCode.RSBlock.getRSBlocks = function(typeNumber, errorCorrectLevel) {

    var rsBlock = QRCodeModel.RS_BLOCK_TABLE[(typeNumber - 1)][errorCorrectLevel];
    var length = rsBlock.length / 3;

    var list = [];

    for (var i = 0; i < length; i++) {
      var count = rsBlock[i * 3 + 0];
      var totalCount = rsBlock[i * 3 + 1];
      var dataCount = rsBlock[i * 3 + 2];
      for (var j = 0; j < count; j++) {
        list.push(new QRCode.RSBlock(totalCount, dataCount));
      }
    }

    return list;
  };

  //---------------------------------------------------------------------
  // QRCode
  //---------------------------------------------------------------------

  QRCode._getTypeNumber = function(sText, nCorrectLevel) {

    var nType = 1;
    var length = QRCode.Util.getLengthInBits(QRCode.Mode.BYTE, nType);

    while (length < sText.length + 20) {
      nType++;
      length = QRCode.Util.getLengthInBits(QRCode.Mode.BYTE, nType);
    }

    return nType;
  };

  //---------------------------------------------------------------------
  // QRCode
  //---------------------------------------------------------------------

  QRCode._normalizeColor = function(color) {
    if (typeof color === 'string') {
      if (color.charAt(0) !== '#') {
        color = '#' + color;
      }
      if (color.length === 4) {
        color = color.replace(/(.)/g, '$1$1');
      }
      return color;
    }
    return color;
  };

  //---------------------------------------------------------------------
  // QRCode
  //---------------------------------------------------------------------

  QRCode._getAndroid = function() {
    try {
      return navigator.userAgent.toLowerCase().indexOf("android") > -1;
    } catch (e) {
      return false;
    }
  };

})();
