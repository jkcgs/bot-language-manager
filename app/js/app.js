(function(){
    'use strict'
    const {remote} = require('electron')
    const botPath = remote.getGlobal('botPath')
    const mgr = new (require('./js/langManager'))(botPath)
    const appDetails = require('../package.json')

    var app = angular.module('app', ['ngMaterial', 'ngMessages', 'ui.router'])
    app.config(function($stateProvider, $urlRouterProvider) {
        $stateProvider.state({
            name: 'main',
            url: '/',
            component: 'main'
        })

        $urlRouterProvider.otherwise('/')
    })

    var mainController = function($mdDialog) {
        var vm = this
        vm.modules = mgr.getModules()
        vm.module = !!vm.modules ? vm.modules[0] : null
        vm.strings = null
        vm.languages = mgr.getLanguages()
        vm.language = !!vm.languages ? vm.languages[0] : null
        vm.copyFromLang = ''

        vm.updateStrings = function() {
            if (vm.module === null) {
                return
            }

            vm.strings = vm.languages.reduce(function(p, lang) {
                p[lang] = mgr.getModuleStrings(vm.module, lang)
                return p
            }, {})
        }

        vm.save = function() {
            if (!vm.module || !vm.language) {
                return
            }

            mgr.saveModuleStringsAll(vm.module, vm.strings)
            vm.updateStrings()
        }

        vm.addString = function(ev) {
            if (!vm.module || !vm.language) {
                return
            }

            let dg = $mdDialog.prompt()
                .title('Add string')
                .textContent('Type in the name for the new string. It will be added to all of available languages.')
                .placeholder('New string name')
                .ariaLabel('New string name')
                .targetEvent(ev)
                .required(true)
                .ok('Add')
                .cancel('Cancel')
            
            $mdDialog.show(dg).then(function(result) {
                if (mgr.addString(vm.module, result)) {
                    vm.updateStrings()
                }
            }, function(){});
        }

        vm.createModule = function(ev) {
            if (!vm.languages) {
                return
            }

            let dg = $mdDialog.prompt()
                .title('Create module')
                .textContent('Type in the name for the new module folder. We will create files for all of the available languages.')
                .placeholder('New module folder name')
                .ariaLabel('New module folder name')
                .targetEvent(ev)
                .required(true)
                .ok('Create')
                .cancel('Cancel')
            
            $mdDialog.show(dg).then(function(result) {
                if (mgr.addModule(result)) {
                    vm.modules = mgr.getModules()
                    vm.module = result;
                    vm.updateStrings()
                }
            }, function(){});
        }

        vm.createLang = function(ev) {
            if (!vm.modules || vm.modules.length === 0) {
                return
            }

            let dg = $mdDialog.prompt()
                .title('Create language')
                .textContent('Type in the new language name. We will copy the values from the current language.')
                .placeholder('New language name')
                .ariaLabel('New language name')
                .targetEvent(ev)
                .required(true)
                .ok('Create')
                .cancel('Cancel')

            $mdDialog.show(dg).then(function(result) {
                mgr.addLanguage(result, vm.language)
                vm.languages = mgr.getLanguages()
            }, function(){})
        }

        vm.showHelp = function(ev) {
            $mdDialog.show({
                controller: HelpController,
                controllerAs: 'vm',
                templateUrl: 'html/help.html',
                parent: angular.element(document.body),
                targetEvent: ev,
                clickOutsideToClose: true
            })
        }

        vm.deleteString = function(ev, strName) {
            var confirm = $mdDialog.confirm()
                .title('Confirm action')
                .textContent('¿Do you really want to delete this string from all the languages?')
                .ariaLabel('Confirm delete of string')
                .targetEvent(ev)
                .ok('OK')
                .cancel('No, thank you')

            $mdDialog.show(confirm).then(function() {
                if (mgr.deleteString(vm.module, strName)) {
                    vm.updateStrings()
                }
            }, function(){})
        }

        vm.copyStrings = function() {
            for (let string of Object.keys(vm.strings[vm.copyFromLang])) {
                vm.strings[vm.language][string] = vm.strings[vm.copyFromLang][string]
            }
        }

        vm.updateStrings()
    }

    app.component('main', {
        templateUrl: 'html/app.html',
        controller: mainController,
        controllerAs: 'vm'
    })

    function HelpController($mdDialog) {
        var vm = this;
        vm.info = appDetails;
        vm.close = function() {
            $mdDialog.hide()
        }
    }

    window.addEventListener('keypress', function(e) {
        if (e.ctrlKey && e.which == 'r') {
            window.location.reload()
        }
    })
}())
