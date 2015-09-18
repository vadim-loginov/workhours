window.angular.module('workhours', [])

.controller('mainCtrl', ['$scope', '$timeout', '$interval', '$window',
    function($scope, $timeout, $interval, $window) {
        'use strict';
        var currentPeriodId,
            currentPeriod,
            dayDuration,
            timer,
            sound,
            storageData;

        sound = new Audio();
        sound.src = 'sound/alarm.mp3';

        function init() {
            currentPeriodId = -1;
            currentPeriod = {
                start: null,
                end: null
            };
            dayDuration = $window.moment.duration(0);
            $scope.periods = [];
            $scope.isPeriodClosed = true;
            $scope.alarmActive = false;
            $scope.soundOn = false;
        }

        init();

        function formatDate(dateObj) {
            return dateObj.toTimeString().split(' ')[0].substr(0, 5);
        }

        function getDuraionFromMsec(msec) {
            var d = $window.moment.duration(msec);
            return d.hours() + 'ч ' + d.minutes() + 'мин';
        }

        $scope.toggleSound = function () {
            if ($scope.soundOn) {
                sound.pause();
                sound.currentTime = 0;
            }
            $scope.soundOn = !$scope.soundOn;
        };

        function alarm(action) {
            if (action === 'stop') {
                if ($scope.soundOn) {
                    sound.pause();
                    sound.currentTime = 0;
                }
                $scope.alarmActive = false;
            } else {
                if ($scope.soundOn) {
                    sound.play();
                }
                $scope.alarmActive = true;
            }
        }

        $scope.startPeriod = function() {
            if (!$scope.isPeriodClosed) {
                return;
            }
            currentPeriodId = currentPeriodId + 1;
            currentPeriod.start = new Date();
            $scope.periods[currentPeriodId] = {
                start: formatDate(currentPeriod.start),
                end: '---',
                duration: {
                    msec: null,
                    pretty: '---'
                }
            };
            $scope.isPeriodClosed = false;
            // Launch timer, that will remind us to take some rest in 45 minutes
            timer = $timeout(alarm, 1000 * 60 * 45);
        };

        $scope.stopPeriod = function() {
            if ($scope.isPeriodClosed) {
                return;
            }

            currentPeriod.end = new Date();
            $scope.periods[currentPeriodId].end = formatDate(currentPeriod.end);
            $scope.periods[currentPeriodId].duration.msec = currentPeriod.end - currentPeriod.start;
            $scope.periods[currentPeriodId].duration.pretty = getDuraionFromMsec(currentPeriod.end - currentPeriod.start);
            // Saving to storage before adding 
            saveToStorage();
            dayDuration.add($scope.periods[currentPeriodId].duration.msec);
            $scope.isPeriodClosed = true;
            // останавливаем таймер
            $timeout.cancel(timer);
            alarm('stop');
        };

        $scope.getDayDuration = function() {
            return getDuraionFromMsec(dayDuration);
        };

        $scope.clearStorage = function() {
            $scope.stopPeriod();
            localStorage.clear();
            init();
        };

        function saveToStorage() {
            var periodsCopy = angular.copy($scope.periods),
                currentPeriodCopy = angular.copy(currentPeriod),
                dayDurationCopy = $window.moment.duration(dayDuration);

            currentPeriodCopy.end = new Date();
            periodsCopy[currentPeriodId].end = formatDate(currentPeriodCopy.end);
            periodsCopy[currentPeriodId].duration.msec = currentPeriodCopy.end - currentPeriodCopy.start;
            periodsCopy[currentPeriodId].duration.pretty = getDuraionFromMsec(currentPeriodCopy.end - currentPeriodCopy.start);
            dayDurationCopy.add(periodsCopy[currentPeriodId].duration.msec);

            localStorage.setItem('workhours_data', JSON.stringify({
                periods: angular.toJson(periodsCopy),
                // will save a string that will be encoded by moment itself
                dayDuration: dayDurationCopy,
                currentPeriodId: currentPeriodId
            }));
        }

        // Save data to localStorage every 30 seconds.
        // Very helpful when you accidentally (or not) close a browser.

        $interval(function() {
            if (!$scope.isPeriodClosed) {
                saveToStorage();
            }
        }, 1000 * 60);

        // Restore data from localStorage on startup

        if (localStorage && localStorage.getItem('workhours_data')) {
            storageData = JSON.parse(localStorage.getItem('workhours_data'));
            currentPeriodId = storageData.currentPeriodId;
            dayDuration = $window.moment.duration(storageData.dayDuration);
            $scope.periods = angular.copy(JSON.parse(storageData.periods));
        }

    }
]);