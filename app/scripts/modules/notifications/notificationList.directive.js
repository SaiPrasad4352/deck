'use strict';

let angular = require('angular');

module.exports = angular.module('spinnaker.notifications.notificationList', [])
    .directive('notificationList', function () {
        return {
            restrict: 'E',
            scope: {
                application: '=',
                type: '=',
                notifications: '=',
            },
            templateUrl: require('./notificationList.directive.html'),
            controller: 'NotificationListCtrl',
            controllerAs: 'notificationListCtrl'
        };
    })
    .controller('NotificationListCtrl', function ($scope, $modal, notificationService) {

        var vm = this;

        vm.revertNotificationChanges = function () {
            notificationService.getNotificationsForApplication($scope.application).then(function (notifications) {
                $scope.notifications = _.filter(_.flatten(_.map(['email', 'sms', 'hipchat'],
                    function (type) {
                        if (notifications[type]) {
                            return _.map(notifications[type], function (entry) {
                                    return _.extend(entry, {type: type});
                                }
                            );
                        }
                    }
                )), function (allow) {
                    return allow !== undefined && allow.level === 'application';
                });
                vm.isNotificationsDirty = false;
            });
        };

        vm.revertNotificationChanges();

        vm.saveNotifications = function () {

            var toSaveNotifications = {};
            toSaveNotifications.application = $scope.application;

            _.each($scope.notifications, function (notification) {
                if (toSaveNotifications[notification.type] === undefined) {
                    toSaveNotifications[notification.type] = [];
                }
                toSaveNotifications[notification.type].push(notification);
            });

            notificationService.saveNotificationsForApplication($scope.application, toSaveNotifications).then(function () {
                vm.revertNotificationChanges();
            });

        };

        vm.editNotification = function (notification) {
            var modalInstance = $modal.open({
                templateUrl: require('./modal/editNotification.html'),
                controller: 'EditNotificationController',
                controllerAs: 'editNotification',
                resolve: {
                    notification: function () {
                        return notification;
                    }
                }
            });

            modalInstance.result.then(function (newNotification) {
                if (!notification) {
                    $scope.notifications.push(newNotification);
                } else {
                    $scope.notifications[$scope.notifications.indexOf(notification)] = newNotification;
                }
                vm.isNotificationsDirty = true;
            });

        };

        vm.addNotification = function () {
            vm.editNotification(undefined);
        };

        vm.removeNotification = function (notification) {
            $scope.notifications = $scope.notifications.filter(function (el) {
                    return el !== notification;
                }
            );
            vm.isNotificationsDirty = true;
        };

        return vm;

    }).name;
