const fs = require('fs')
const path = require('path')
const yaml = require('js-yaml')

class LangManager {
    /**
     * Creates the instance based on the bot path. It takes then it appends the 'lang' folder to that path.
     * @param {string} botPath The bot path root.
     */
    constructor(botPath) {
        // Raise an error if the path blah blah blah
        if (!fs.statSync(botPath).isDirectory()) {
            throw new Error('Bot path is not a directory')
        }

        // Delete 'lang' if it's a file
        let langPath = path.join(botPath, 'lang')
        if (fs.existsSync(langPath) && !fs.statSync(langPath).isDirectory()) {
            fs.unlinkSync(langPath);
        }
        
        // Create 'lang' folder if it does not exist
        if (!fs.existsSync(langPath)) {
            fs.mkdirSync(langPath);
        }
        
        // Set lang path locally
        this.path = langPath
    }

    /**
     * Looks up for all the directories inside the lang directory
     *
     * @returns An array of directory names inside the lang directory
     * @memberof LangManager
     */
    getModules() {
        return fs.readdirSync(this.path).filter(mod => {
            return fs.statSync(path.join(this.path, mod)).isDirectory()
        })
    }

    /**
     * Generates the full path to a module folder
     *
     * @param {string} mod The module name
     * @returns A full path to the module inside the language folder, null if it does not exist
     * or if it's not a folder.
     * @memberof LangManager
     */
    getModulePath(mod) {
        let modPath = path.join(this.path, mod)
        if (!fs.existsSync(modPath) || !fs.statSync(modPath).isDirectory()) {
            return null
        }

        return modPath
    }

    /**
     * Generates a list of the full paths for all the available modules
     * inside the language directory
     *
     * @returns An array of strings with the full paths of modules
     * @memberof LangManager
     */
    getModulesPaths() {
        return this.getModules().map(m => this.getModulePath(m))
    }

    /**
     * Traverses over all the modules inside the language directory
     * and determines the currently language files
     *
     * @returns An array with a list of available languages codes
     * @memberof LangManager
     */
    getLanguages() {
        let langs = []
        this.getModulesPaths().forEach(modPath => {
            fs.readdirSync(modPath).forEach(lang => {
                // Language files should end with '.yml'
                if (!lang.endsWith('.yml')) {
                    return
                }
                
                // Filename without extension is the language name, avoid duplicates
                lang = lang.substr(0, lang.length - 4)
                if (!langs.includes(lang)) {
                    langs.push(lang)
                }
            })
        })

        return langs
    }

    getModuleLanguagePath(mod, language) {
        let modPath = this.getModulePath(mod)
        if (mod === null) {
            return null
        }

        return path.join(modPath, language + '.yml')
    }

    /**
     * Checks for all available strings for a module. It looks up for all available language
     * files, looking for the keys of strings, then it concats and de-dup them.
     *
     * @param {string} mod The module name
     * @returns {array} An array of string names or null if it's not a valid module
     * @memberof LangManager
     */
    getModuleStringNames(mod) {
        let strings = []

        // Get module path. If it does not exist, it returns null, so, we return it too.
        let modPath = this.getModulePath(mod)
        if (modPath === null) {
            return null
        }

        // Reads all files ended with '.yml'
        fs.readdirSync(modPath).filter(m => m.endsWith('.yml')).forEach(lang => {
            // Load/parse lang yaml file
            let doc = yaml.safeLoad(fs.readFileSync(path.join(modPath, lang), 'utf8'))
            // Get strings that are not loaded on the strings list
            let docStrings = Object.keys(doc || {}).filter(k => !strings.includes(k))
            // Add them to the list
            strings = [...strings, ...docStrings]
        })

        return strings
    }

    /**
     * Retrieves a full set of key-value pairs of strings for a module and language
     * @param {string} mod The module name
     * @param {string} language The language identifier
     * @returns {object} An object containing all of the strings with their values for a module.
     * If the module does not exist, it returns null. If the language does not exist, it will return
     * an empty set.
     */
    getModuleStrings(mod, language) {
        // Get module path and then the language file path
        let modPath = this.getModulePath(mod)
        let langPath = modPath === null ? null : path.join(modPath, language + '.yml')
        if (mod === null) {
            return null
        }

        // Load the language file if it exists. If not, use an empty object
        let doc = fs.existsSync(langPath) ? yaml.safeLoad(fs.readFileSync(langPath, 'utf8')) : {}
        let names = this.getModuleStringNames(mod)
        let values = []
        let keys = []

        // Fill all of the strings. There could be strings that are not filled in some languages.
        for(let k of names) {
            if (keys.includes(k)) continue

            values.push({
                'name': k,
                'value': (!!doc && doc.hasOwnProperty(k)) ? doc[k] + '' : ''
            })
            keys.push(k)
        }

        return values
    }

    /**
     * Stores an object as a yml file in a language file, replacing its current content.
     * 
     * @param {string} mod The module name
     * @param {string} language Language identifier
     * @param {object} strings A key-value pair object containing strings with their values
     * @returns {boolean} A value depending of the success of the process. It returns false
     * if the language or module does not exist.
     */
    saveModuleStrings(mod, language, strings) {
        // Load language file path. If it returns null, we return it too.
        let langPath = this.getModuleLanguagePath(mod, language)
        if (langPath === null) {
            return false
        }

        // Generate YAML content to store it to the file
        let content = strings.length == 0 ? [] : strings.reduce((p, c) => { p[c.name] = c.value; return p }, {})
        content = yaml.dump(content)
        fs.writeFileSync(this.getModuleLanguagePath(mod, language), content, 'utf8')
        return true
    }

    /**
     * Creates an empty string on all available languages
     * @param {string} mod Module name
     * @param {string} stringName String name
     * @returns {boolean} A value that depends on the success of the operation,
     * i.e. if the module does not exist, it returns false.
     */
    addString(mod, stringName) {
        if (mod === null) {
            return false
        }

        // Ignore if the string already exists
        if (this.getModuleStringNames(mod).includes(stringName)) {
            return false
        }

        this.getLanguages().forEach(lang => {
            // Load strings for a language and add the string to it
            let strings = this.getModuleStrings(mod, lang)
            strings.push({'name': stringName, 'value': ''})

            // Store the content
            this.saveModuleStrings(mod, lang, strings)
        })

        return true
    }

    /**
     * Removes a string from all the available languages
     * @param {string} mod The module name
     * @param {string} stringName The string name
     */
    deleteString(mod, stringName) {
        if (mod === null) {
            return false
        }

        // Ignore if the string doesn't exists
        if (!this.getModuleStringNames(mod).includes(stringName)) {
            return false
        }

        this.getLanguages().forEach(lang => {
            // Load strings for a language and remove the string from it
            let strings = this.getModuleStrings(mod, lang)
            strings = strings.filter(x => x.name != stringName)
            console.log(strings)

            // Store the content
            this.saveModuleStrings(mod, lang, strings)
        })

        return true
    }

    /**
     * Adds a module, by creating its folder on the 'lang' folder, and creates empty .yml
     * files for all available languages.
     * @param {string} modName The module name
     * @returns {boolean} A value that depends on the success of the operation
     */
    addModule(modName) {
        // If the module already exists, return
        if (this.getModules().includes(modName)) {
            return false
        }

        // Create the directory
        let modPath = path.join(this.path, modName)
        fs.mkdirSync(modPath)

        // Create the empty language files
        this.getLanguages().forEach(lang => {
            let langPath = path.join(modPath, lang + '.yml')
            fs.closeSync(fs.openSync(langPath, 'w'));
        })

        return true
    }

    /**
     * Adds a language by creating every language file for all of the modules.
     * It will copy the content from an existing language if selected.
     * @param {string} language Identifier for the new language.
     * @param {string?} copyFrom Language identifier to copy values from.
     * If undefined, it will use empty strings instead of copying values.
     */
    addLanguage(language, copyFrom) {
        // If the language already exists, ignore it.
        let langs = this.getLanguages()
        if (langs.includes(language)) {
            return false
        }

        // If the copy-from language does not exist, return
        if (typeof copyFrom !== 'undefined' && !langs.includes(copyFrom)) {
            return;
        }

        // Get every module path
        this.getModulesPaths().forEach(modPath => {
            let langPath = path.join(modPath, language + '.yml')
            let copyPath = path.join(modPath, copyFrom + '.yml')

            if (!!copyFrom && fs.existsSync(copyPath)) {
                // If copy-from is set, copy the language file with the new language name
                fs.copyFileSync(copyPath, langPath)
            } else {
                // If the copy-from variable is not set, just create an empty file
                fs.closeSync(fs.openSync(langPath, 'w'));
            }
        })

        return true
    }
}

module.exports = LangManager
