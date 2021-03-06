angular.module('colorpicker.module', [])
    .factory('Helper', function() {
        'use strict';
        return {
            closestSlider: function(elem) {
                var matchesSelector = elem.matches || elem.webkitMatchesSelector || elem.mozMatchesSelector || elem.msMatchesSelector;
                if (matchesSelector.bind(elem)('I')) {
                    return elem.parentNode;
                }
                return elem;
            },
            getOffset: function(elem, fixedPosition) {
                var
                    x = 0,
                    y = 0,
                    scrollX = 0,
                    scrollY = 0;

                while (elem && !isNaN(elem.offsetLeft) && !isNaN(elem.offsetTop)) {
                    x += elem.offsetLeft;
                    y += elem.offsetTop;
                    if (!fixedPosition && elem.tagName === 'BODY') {
                        scrollX += document.documentElement.scrollLeft || elem.scrollLeft;
                        scrollY += document.documentElement.scrollTop || elem.scrollTop;
                    } else {
                        scrollX += elem.scrollLeft;
                        scrollY += elem.scrollTop;
                    }
                    elem = elem.offsetParent;
                }
                return {
                    top: y,
                    left: x,
                    scrollX: scrollX,
                    scrollY: scrollY
                };
            },
            // a set of RE's that can match strings and generate color tuples. https://github.com/jquery/jquery-color/
            stringParsers: [{
                re: /rgba?\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*(?:,\s*(\d+(?:\.\d+)?)\s*)?\)/,
                parse: function(execResult) {
                    return [
                        execResult[1],
                        execResult[2],
                        execResult[3],
                        execResult[4]
                    ];
                }
            }, {
                re: /rgba?\(\s*(\d+(?:\.\d+)?)\%\s*,\s*(\d+(?:\.\d+)?)\%\s*,\s*(\d+(?:\.\d+)?)\%\s*(?:,\s*(\d+(?:\.\d+)?)\s*)?\)/,
                parse: function(execResult) {
                    return [
                        2.55 * execResult[1],
                        2.55 * execResult[2],
                        2.55 * execResult[3],
                        execResult[4]
                    ];
                }
            }, {
                re: /#([a-fA-F0-9]{2})([a-fA-F0-9]{2})([a-fA-F0-9]{2})/,
                parse: function(execResult) {
                    return [
                        parseInt(execResult[1], 16),
                        parseInt(execResult[2], 16),
                        parseInt(execResult[3], 16)
                    ];
                }
            }, {
                re: /#([a-fA-F0-9])([a-fA-F0-9])([a-fA-F0-9])/,
                parse: function(execResult) {
                    return [
                        parseInt(execResult[1] + execResult[1], 16),
                        parseInt(execResult[2] + execResult[2], 16),
                        parseInt(execResult[3] + execResult[3], 16)
                    ];
                }
            }]
        };
    })
    .factory('Color', ['Helper', function(Helper) {
        'use strict';
        return {
            value: {
                h: 1,
                s: 1,
                b: 1,
                a: 1
            },
            // translate a format from Color object to a string
            'rgb': function() {
                var rgb = this.toRGB();
                return 'rgb(' + rgb.r + ',' + rgb.g + ',' + rgb.b + ')';
            },
            'rgba': function() {
                var rgb = this.toRGB();
                return 'rgba(' + rgb.r + ',' + rgb.g + ',' + rgb.b + ',' + rgb.a + ')';
            },
            'hex': function() {
                return this.toHex();
            },

            // HSBtoRGB from RaphaelJS
            RGBtoHSB: function(r, g, b, a) {
                r /= 255;
                g /= 255;
                b /= 255;

                var H, S, V, C;
                V = Math.max(r, g, b);
                C = V - Math.min(r, g, b);
                H = (C === 0 ? null :
                    V === r ? (g - b) / C :
                    V === g ? (b - r) / C + 2 :
                    (r - g) / C + 4
                );
                H = ((H + 360) % 6) * 60 / 360;
                S = C === 0 ? 0 : C / V;
                return {
                    h: H || 1,
                    s: S,
                    b: V,
                    a: a || 1
                };
            },

            //parse a string to HSB
            setColor: function(val) {
                val = val.toLowerCase();
                for (var key in Helper.stringParsers) {
                    if (Helper.stringParsers.hasOwnProperty(key)) {
                        var parser = Helper.stringParsers[key];
                        var match = parser.re.exec(val),
                            values = match && parser.parse(match);
                        if (values) {
                            this.value = this.RGBtoHSB.apply(null, values);
                            return false;
                        }
                    }
                }
            },

            setHue: function(h) {
                this.value.h = 1 - h;
            },

            setSaturation: function(s) {
                this.value.s = s;
            },

            setLightness: function(b) {
                this.value.b = 1 - b;
            },

            setAlpha: function(a) {
                this.value.a = parseInt((1 - a) * 100, 10) / 100;
            },

            // HSBtoRGB from RaphaelJS
            // https://github.com/DmitryBaranovskiy/raphael/
            toRGB: function(h, s, b, a) {
                if (!h) {
                    h = this.value.h;
                    s = this.value.s;
                    b = this.value.b;
                }
                h *= 360;
                var R, G, B, X, C;
                h = (h % 360) / 60;
                C = b * s;
                X = C * (1 - Math.abs(h % 2 - 1));
                R = G = B = b - C;

                h = ~~h;
                R += [C, X, 0, 0, X, C][h];
                G += [X, C, C, X, 0, 0][h];
                B += [0, 0, X, C, C, X][h];
                return {
                    r: Math.round(R * 255),
                    g: Math.round(G * 255),
                    b: Math.round(B * 255),
                    a: a || this.value.a
                };
            },

            toHex: function(h, s, b, a) {
                var rgb = this.toRGB(h, s, b, a);
                return '#' + ((1 << 24) | (parseInt(rgb.r, 10) << 16) | (parseInt(rgb.g, 10) << 8) | parseInt(rgb.b, 10)).toString(16).substr(1);
            }
        };
    }])
    .factory('Slider', ['Helper', function(Helper) {
        'use strict';
        var
            slider = {
                maxLeft: 0,
                maxTop: 0,
                callLeft: null,
                callTop: null,
                knob: {
                    top: 0,
                    left: 0
                }
            },
            pointer = {};

        return {
            getSlider: function() {
                return slider;
            },
            getLeftPosition: function(event) {
                return Math.max(0, Math.min(slider.maxLeft, slider.left + ((event.pageX || pointer.left) - pointer.left)));
            },
            getTopPosition: function(event) {
                return Math.max(0, Math.min(slider.maxTop, slider.top + ((event.pageY || pointer.top) - pointer.top)));
            },
            setSlider: function(event, fixedPosition) {
                var
                    target = Helper.closestSlider(event.target),
                    targetOffset = Helper.getOffset(target, fixedPosition),
                    rect = target.getBoundingClientRect(),
                    offsetX = event.clientX - rect.left,
                    offsetY = event.clientY - rect.top;

                slider.knob = target.children[0].style;
                slider.left = event.pageX - targetOffset.left - window.pageXOffset + targetOffset.scrollX;
                slider.top = event.pageY - targetOffset.top - window.pageYOffset + targetOffset.scrollY;

                pointer = {
                    left: event.pageX - (offsetX - slider.left),
                    top: event.pageY - (offsetY - slider.top)
                };
            },
            setSaturation: function(event, fixedPosition) {
                slider = {
                    maxLeft: 100,
                    maxTop: 100,
                    callLeft: 'setSaturation',
                    callTop: 'setLightness'
                };
                this.setSlider(event, fixedPosition);
            },
            setHue: function(event, fixedPosition) {
                slider = {
                    maxLeft: 0,
                    maxTop: 100,
                    callLeft: false,
                    callTop: 'setHue'
                };
                this.setSlider(event, fixedPosition);
            },
            setAlpha: function(event, fixedPosition) {
                slider = {
                    maxLeft: 0,
                    maxTop: 100,
                    callLeft: false,
                    callTop: 'setAlpha'
                };
                this.setSlider(event, fixedPosition);
            },
            setKnob: function(top, left) {
                slider.knob.top = top + 'px';
                slider.knob.left = left + 'px';
            }
        };
    }])
    .factory('Swatches', function() {
        'use strict';

        // Contains all the preset colors
        var colors = [
            ['#1e5667', '#3d7e92', '#97cad9', '#b6dfeb'],
            ['#863a27', '#c75336', '#d8765d', '#fbbfb0'],
            ['#677b31', '#8ba446', '#b0c870', '#def0ac'],
            ['#f28e1b', '#e19d4e', '#ffc17a', '#f8e7b9'],
            ['#520039', '#854271', '#a186be', '#d9cce7'],
            ['#603816', '#ad6628', '#e0b48d', '#edd1b8']
        ];
        return {
            getSwatches: function(elem) {
                return colors;
            }
        };
    })
    .directive('colorpicker', ['$window', '$document', '$compile', '$timeout', 'Color', 'Slider', 'Helper', 'Swatches', function($window, $document, $compile, $timeout, Color, Slider, Helper, Swatches) {
        'use strict';
        return {
            require: '?ngModel',
            restrict: 'A',
            link: function($scope, elem, attrs, ngModel) {
                var
                    unBindWatcher,
                    streamid = attrs.streamid,
                    thisFormat = attrs.colorpicker ? attrs.colorpicker : 'hex',
                    position = angular.isDefined(attrs.colorpickerPosition) ? attrs.colorpickerPosition : 'right',
                    fixedPosition = angular.isDefined(attrs.colorpickerFixedPosition) ? attrs.colorpickerFixedPosition : false,
                    target = angular.isDefined(attrs.colorpickerParent) ? elem.parent() : angular.element(document.body),
                    withInput = angular.isDefined(attrs.colorpickerWithInput) ? attrs.colorpickerWithInput : false,
                    inputTemplate = withInput ? '<input type="text" name="colorpicker-input">' : '',
                    switchButton = '<div ng-if="!palette" class="switch-colorpicker" ng-click="switchColorpickerView($event);" stop-propagation><i class="icon icon-paintbrush"></i></div><div class="switch-colorpicker" ng-if="palette" ng-click="switchColorpickerView($event);" stop-propagation><i class="icon icon-swatches"></i></div>',
                    stripesCheckBox = '<input class="experimental-checkbox left" type="checkbox" ng-click="toggleStripes()" id="[[streamPickerLabelId]]"> <label class="inline-block left ml1" for="[[streamPickerLabelId]]">STRIPES</label>',

                    template =
                        '<div class="colorpicker">' +
                        '<div class="colorpicker-inner">' +
                        '<div id="colorpicker-palette" ng-show="palette">' +
                        '<colorpicker-saturation><i></i></colorpicker-saturation>' +
                        '<colorpicker-hue><i></i></colorpicker-hue>' +
                        '<colorpicker-alpha><i></i></colorpicker-alpha>' +
                        '<colorpicker-preview></colorpicker-preview>' +
                        inputTemplate +
                        '</div>' +
                        '<div id="colorpicker-swatch" ng-show="!palette">' +
                        '<div class="visualizer-swatch-row left" ng-class="{\'m0\': $last}" ng-repeat="rows in swatchColors">' +
                        '<div ng-repeat="color in rows" class="visualizer-square" ng-class="{\'selected\': colorCheck(color)} "ng-style="{background: toggleSwatchStrip(color)}" style="background:[[color]]; border-color: [[color]]" ng-click="selectColor(color)"></div>' +
                        '</div>' +
                        '</div>' +
                        '<div class="swatch-controls clearfix">' +
                        '<div class="left">' +
                        stripesCheckBox +
                        '</div>' +
                        '<div class="right">' +
                        switchButton +
                        '</div>' +
                        '</div>' +
                        '</div>' +
                        '</div>',
                    colorpickerTemplate = angular.element(template),
                    pickerColor = Color,
                    sliderAlpha,
                    sliderHue = colorpickerTemplate.find('colorpicker-hue'),
                    sliderSaturation = colorpickerTemplate.find('colorpicker-saturation'),
                    colorpickerPreview = colorpickerTemplate.find('colorpicker-preview'),
                    pickerColorPointers = colorpickerTemplate.find('i');



                // Modified for TM
                angular.element($window).bind('resize', function() {
                    hideColorpickerTemplate();
                });

                $scope.swatchColors = Swatches.getSwatches();

                $scope.selectColor = function(color) {
                    ngModel.$setViewValue(color)
                };

                $scope.toggleStripes = function(event) {
                    var payload = {
                        streamid: attrs.streamid
                    };
                    // Event to toggle stripes used by TM SPA
                    $scope.$emit('toggleStripes', payload);
                };

                $scope.palette = false;

                $scope.toggleSwatchStrip = function(color) {
                    if (attrs.dashed == 'true') {
                        return 'repeating-linear-gradient(45deg, white, white 2px,' + color + ' 2px,' + color + ' 6px)'
                    } else {
                        return color
                    }
                }

                // Used to generate an UUID for Labels
                $scope.streamPickerLabelId = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
                    var r = crypto.getRandomValues(new Uint8Array(1))[0] % 16 | 0,
                        v = c == 'x' ? r : (r & 0x3 | 0x8);
                    return v.toString(16);
                });

                $scope.colorCheck = function(color) {
                    return ngModel.$modelValue == color
                }

                // End of Modification

                //Manually Compile Directive with Scope

                $compile(colorpickerTemplate)($scope);

                if (withInput) {
                    var pickerColorInput = colorpickerTemplate.find('input');
                    pickerColorInput
                        .on('mousedown', function(event) {
                            event.stopPropagation();
                        })
                        .on('keyup', function(event) {
                            var newColor = this.value;
                            elem.val(newColor);
                            if (ngModel) {
                                $scope.$apply(ngModel.$setViewValue(newColor));
                            }
                            event.stopPropagation();
                            event.preventDefault();
                        });
                    elem.on('keyup', function() {
                        pickerColorInput.val(elem.val());
                    });
                }

                var bindMouseEvents = function() {
                    $document.on('mousemove', mousemove);
                    $document.on('mouseup', mouseup);
                };

                if (thisFormat === 'rgba') {
                    colorpickerTemplate.addClass('alpha');
                    sliderAlpha = colorpickerTemplate.find('colorpicker-alpha');
                    sliderAlpha
                        .on('click', function(event) {
                            Slider.setAlpha(event, fixedPosition);
                            mousemove(event);
                        })
                        .on('mousedown', function(event) {
                            Slider.setAlpha(event, fixedPosition);
                            bindMouseEvents();
                        })
                        .on('mouseup', function(event) {
                            emitEvent('colorpicker-selected-alpha');
                        });
                }

                sliderHue
                    .on('click', function(event) {
                        Slider.setHue(event, fixedPosition);
                        mousemove(event);
                    })
                    .on('mousedown', function(event) {
                        Slider.setHue(event, fixedPosition);
                        bindMouseEvents();
                    })
                    .on('mouseup', function(event) {
                        emitEvent('colorpicker-selected-hue');
                    });

                sliderSaturation
                    .on('click', function(event) {
                        Slider.setSaturation(event, fixedPosition);
                        mousemove(event);
                        if (angular.isDefined(attrs.colorpickerCloseOnSelect)) {
                            hideColorpickerTemplate();
                        }
                    })
                    .on('mousedown', function(event) {
                        Slider.setSaturation(event, fixedPosition);
                        bindMouseEvents();
                    })
                    .on('mouseup', function(event) {
                        emitEvent('colorpicker-selected-saturation');
                    });

                if (fixedPosition) {
                    colorpickerTemplate.addClass('colorpicker-fixed-position');
                }

                colorpickerTemplate.addClass('colorpicker-position-' + position);
                target.append(colorpickerTemplate);




                var bindWatcher = function() {
                    if (ngModel) {
                        ngModel.$render = function() {
                            elem.val(ngModel.$viewValue);
                        };

                        // This returns a function that unbinds the watch
                        return  $scope.$watch(attrs.ngModel, function(newVal, oldVal) {
                            update();
                            if (withInput) {
                                pickerColorInput.val(newVal);
                            }
                        });

                    }
                };

                elem.on('$destroy', function() {
                    colorpickerTemplate.remove();
                });

                var previewColor = function() {
                    try {
                        colorpickerPreview.css('backgroundColor', pickerColor[thisFormat]());
                    } catch (e) {
                        colorpickerPreview.css('backgroundColor', pickerColor.toHex());
                    }
                    sliderSaturation.css('backgroundColor', pickerColor.toHex(pickerColor.value.h, 1, 1, 1));
                    if (thisFormat === 'rgba') {
                        sliderAlpha.css.backgroundColor = pickerColor.toHex();
                    }
                };

                var mousemove = function(event) {
                    var
                        left = Slider.getLeftPosition(event),
                        top = Slider.getTopPosition(event),
                        slider = Slider.getSlider();

                    Slider.setKnob(top, left);

                    if (slider.callLeft) {
                        pickerColor[slider.callLeft].call(pickerColor, left / 100);
                    }
                    if (slider.callTop) {
                        pickerColor[slider.callTop].call(pickerColor, top / 100);
                    }
                    previewColor();
                    var newColor = pickerColor[thisFormat]();
                    elem.val(newColor);
                    if (ngModel) {
                        $scope.$apply(ngModel.$setViewValue(newColor));

                    }
                    if (withInput) {
                        pickerColorInput.val(newColor);
                    }
                    return false;
                };

                var mouseup = function() {
                    emitEvent('colorpicker-selected');
                    $document.off('mousemove', mousemove);
                    $document.off('mouseup', mouseup);
                };

                var update = function() {
                    pickerColor.setColor(elem.val());
                    pickerColorPointers.eq(0).css({
                        left: pickerColor.value.s * 100 + 'px',
                        top: 100 - pickerColor.value.b * 100 + 'px'
                    });
                    pickerColorPointers.eq(1).css('top', 100 * (1 - pickerColor.value.h) + 'px');
                    pickerColorPointers.eq(2).css('top', 100 * (1 - pickerColor.value.a) + 'px');
                    previewColor();
                    // emit event for color change
                    $scope.$emit('colorChange');
                };

                var getColorpickerTemplatePosition = function() {
                    var
                        positionValue,
                        positionOffset = Helper.getOffset(elem[0]);

                    if (angular.isDefined(attrs.colorpickerParent)) {
                        positionOffset.left = 0;
                        positionOffset.top = 0;
                    }

                    if (position === 'top') {
                        positionValue = {
                            'top': positionOffset.top - 147,
                            'left': positionOffset.left
                        };
                    } else if (position === 'right') {
                        positionValue = {
                            'top': positionOffset.top - 95,
                            'left': positionOffset.left + 34
                        };
                    } else if (position === 'bottom') {
                        positionValue = {
                            'top': positionOffset.top + elem[0].offsetHeight + 2,
                            'left': positionOffset.left
                        };
                    } else if (position === 'left') {
                        positionValue = {
                            'top': positionOffset.top,
                            'left': positionOffset.left - 150
                        };
                    }
                    return {
                        'top': positionValue.top + 'px',
                        'left': positionValue.left + 'px'
                    };
                };

                var documentMousedownHandler = function() {
                    // De-register watchers
                    unBindWatcher();
                    hideColorpickerTemplate();
                };

                var showColorpickerTemplate = function() {
                    // Bind the unwatch function to a global variable inside the directive
                    unBindWatcher = bindWatcher();
                    if (!colorpickerTemplate.hasClass('colorpicker-visible')) {
                        update();
                        colorpickerTemplate
                            .addClass('colorpicker-visible')
                            .css(getColorpickerTemplatePosition());
                        emitEvent('colorpicker-shown');

                        // register global mousedown event to hide the colorpicker
                        $document.on('mousedown', documentMousedownHandler);

                        if (attrs.colorpickerIsOpen) {
                            $scope[attrs.colorpickerIsOpen] = true;
                            if (!$scope.$$phase) {
                                $scope.$digest(); //trigger the watcher to fire
                            }
                        }
                    }

                };

                elem.on('click', showColorpickerTemplate);

                colorpickerTemplate.on('mousedown', function(event) {
                    event.stopPropagation();
                    event.preventDefault();
                });

                var emitEvent = function(name) {
                    if (ngModel) {
                        $scope.$emit(name, {
                            name: attrs.ngModel,
                            value: ngModel.$modelValue
                        });
                    }
                };

                var hideColorpickerTemplate = function() {
                    if (colorpickerTemplate.hasClass('colorpicker-visible')) {
                        colorpickerTemplate.removeClass('colorpicker-visible');
                        emitEvent('colorpicker-closed');
                        // unregister the global mousedown event
                        $document.off('mousedown', documentMousedownHandler);

                        if (attrs.colorpickerIsOpen) {
                            $scope[attrs.colorpickerIsOpen] = false;
                            if (!$scope.$$phase) {
                                $scope.$digest(); //trigger the watcher to fire
                            }
                        }
                    }
                };

                $scope.switchColorpickerView = function(event) {
                    $scope.palette = !$scope.palette;
                };

                if (attrs.colorpickerIsOpen) {
                    $scope.$watch(attrs.colorpickerIsOpen, function(shouldBeOpen) {

                        if (shouldBeOpen === true) {
                            showColorpickerTemplate();
                        } else if (shouldBeOpen === false) {
                            hideColorpickerTemplate();
                        }

                    });
                }

            }
        };
    }]);
