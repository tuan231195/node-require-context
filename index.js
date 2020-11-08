const context = (directory = '.', useSubdirectories = false, regExp = /(?:)/) => {
	const fs = require('fs');
	const path = require('path');
	const callsites = require('callsites');
	const isRegExp = (regExp) => {
		return Object.prototype.toString.call(regExp) === '[object RegExp]';
	};
	const isString = (str) => {
		return typeof str === 'string';
	};

	class RequireContext {

		constructor(directory, useSubdirectories, regExp) {
			this.modules = [];
			this.directory = this.__findDirectory(directory);
			this.useSubdirectories = !!useSubdirectories;
			this.regExp = regExp;
			this.__findModules(this.directory);
		}

		__findDirectory(directory) {
			if (path.isAbsolute(directory)) {
				return directory;
			}
			const parentDir = path.dirname(callsites()[1].getFileName());
			return path.normalize(path.join(parentDir, directory));
		}

		__findModules(directory) {
			if (fs.existsSync(directory)) {
				fs.readdirSync(directory).forEach(file => {
					const moduleId = path.resolve(directory, file);
					if (fs.statSync(moduleId).isDirectory()) {
						if (this.useSubdirectories) {
							this.__findModules(moduleId);
							return;
						}
					}
					if (this.regExp && !this.regExp.test(moduleId)) {
						return;
					}
					this.modules.push(moduleId);
				});
			} else {
				throw new Error(`Can\'t Found Module ${directory}`);
			}
		}

	}

	if (!isString(directory)) {
		throw new Error('Argument [directory] must be String');
	}
	if (!isRegExp(regExp)) {
		throw new Error('Argument [regExp] must be RegExp');
	}
	const requireContext = new RequireContext(directory, useSubdirectories, regExp);
	const ModuleRequire = (moduleId) => require(path.resolve(requireContext.directory, moduleId));
	ModuleRequire.keys = () => [...requireContext.modules];
	return ModuleRequire;
};
module.exports = context;
module.exports.default = context;

