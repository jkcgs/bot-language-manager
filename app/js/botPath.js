const fs = require('fs')
const path = require('path')
const {dialog} = require('electron')

// Validation files
const requiredFiles = ['bot', 'run.py', 'config.yml.example']
const requiredBotFiles = ['bot.py', 'command.py', 'manager.py', 'events', 'libs']

module.exports = {
    /**
     * Retrieves the first path selected by showOpenDialog. If cancelled,
     * null is returned.
     */
    getPath: function() {
        let paths = dialog.showOpenDialog({ properties: ['openDirectory'] })
        return (!!paths && paths.length > 0) ? paths[0] : null
    },

    /**
     * Validates a path to be a bot folder
     */
    validatePath: function(thePath) {
        let validationCount = 0

        // Check if the path exists
        if (!fs.existsSync(thePath)) {
            return false
        }

        // Get folder files
        fs.readdirSync(thePath).forEach(file => {
            // If there's a "bot" filename
            if (file === 'bot') {
                // Check if it's a folder
                let botFolderPath = path.join(thePath, file)
                if (!fs.statSync(botFolderPath).isDirectory()) {
                    return false
                }
                
                // Raise validation count and check this folder's content
                validationCount++
                fs.readdirSync(botFolderPath).forEach(botFile => {
                    if (requiredBotFiles.includes(botFile)) {
                        validationCount++
                    }
                })
            } else if (requiredFiles.includes(file)) {
                validationCount++
            }
        })

        // Check if validation count is the same amount of required files amount
        return validationCount == (requiredFiles.length + requiredBotFiles.length)
    },

    /**
     * Returns a valid bot path, via Electron's showOpenDialog method.
     * This dialog will not close until a valid folder is selected or if it's cancelled.
     */
    getBotPath: function() {
        while(true) {
            // Show dialog
            let selectedPath = this.getPath()

            // Dialog cancelled
            if (selectedPath === null) {
                console.log('Bot path not selected')
                return null
            }

            // If it's not cancelled and a path is selected, validate it
            if (!this.validatePath(selectedPath)) {
                dialog.showErrorBox('Invalid bot path', 'Could not find bot in the selected path.')
            } else {
                return selectedPath
            }
        }
    }
}
