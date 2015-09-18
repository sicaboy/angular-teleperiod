(function() {
    'use strict';




    angular.module('tpTeleperiod', [])

    .directive('tpScopeElement', function () {
      return {
        restrict: 'A',
        compile: function compile() {
            return {
                pre: function preLink(scope, iElement, iAttrs) {
                    scope[iAttrs.tpScopeElement] = iElement;
                }
            };
        }
      };
    })

    .directive('tpTeleperiod', function() {

        return {
            restrict: 'AE',
            controller: function controller($scope) {

                /**
                 * @param {string} method name in scope, get from the directive attribute
                 * @return {Promise}
                 */
                this.getPromisedData = function getPromisedData(method, interval) {
                    var deferred = Q.defer();

                    var fn = $scope[method];
                    if (fn === undefined) {
                        deferred.reject();
                    } else {
                        deferred.resolve(fn(interval));
                    }

                    return deferred.promise;
                };

            }
        };
    })

    .directive('tpPeriodPicker', function($parse) {

        return {
            restrict: 'E',
            replace: true,
            require: '^tpTeleperiod',
            template: '<svg tp-scope-element="svg"></svg>',
            compile: function compile() {

                return function compile(scope, iElement, attrs, teleperiodScope) {


                    teleperiodScope.d3Svg = d3.select(scope.svg[0]);
                    scope.focusDate = attrs.focusDate || new Date();
                    var selectedEventId = null;


                    if (undefined !== attrs.selectedevent) {

                        var selectedEvent = $parse(attrs.selectedevent)(scope);
                        if (undefined !== selectedEvent && undefined !== selectedEvent.uid) {
                            selectedEventId = selectedEvent.uid;
                        }
                    }

                    function updateScope(selection) {
                        $parse(attrs.dtstart).assign(scope, selection.dtstart);
                        $parse(attrs.dtend).assign(scope, selection.dtend);

                        if (undefined !== attrs.periods) {
                            $parse(attrs.periods).assign(scope, selection.getValidPeriods());
                        }
                    }


                    teleperiodScope.teleperiod = new Teleperiod({
                        object: teleperiodScope.d3Svg,
                        focusDate: scope.focusDate,
                        selectedEvent: selectedEventId,
                        workingtimes: function(interval) {
                            return teleperiodScope.getPromisedData(attrs.workingtimes, interval);
                        },

                        events: function(interval) {
                            return teleperiodScope.getPromisedData(attrs.events, interval);
                        },

                        onUpdated: function(selection) {
                            scope.$apply(function() {
                                updateScope(selection);
                            });
                        }
                    });

                    setTimeout(teleperiodScope.teleperiod.draw, 0);
                    
                    
                    scope.$watch(attrs.refreshevents, function(newValue) {

                        if (newValue) {
                            teleperiodScope.teleperiod.refreshEvents();
                        }
                        
                        scope[attrs.refreshevents] = false;
                    }, true);


                    scope.$watch(attrs.dtstart, function(newValue) {

                        var selection = teleperiodScope.teleperiod.selection;

                        if (newValue) {
                            selection.dtstart = newValue;
                            selection.removeOverlay();
                            selection.highlightPeriods();
                        }
                    }, true);

                    scope.$watch(attrs.dtend, function(newValue) {

                        var selection = teleperiodScope.teleperiod.selection;

                        if (newValue) {
                            selection.dtend = newValue;
                            selection.removeOverlay();
                            selection.highlightPeriods();
                        }
                    }, true);

                };

            }
        };
    })

    .directive('tpTimeline', function() {

        return {
            restrict: 'E',
            require: '^tpTeleperiod',
            link: function(scope, element, attrs, teleperiodScope) {

                var timeline = new Timeline(attrs.name, function(interval) {
                    return teleperiodScope.getPromisedData(attrs.events, interval);
                });

                teleperiodScope.teleperiod.addTimeLine(timeline);
                // teleperiodScope.teleperiod.draw();
            }
        };
    });
}());
