import * as fs from 'node:fs'

export class Config {
	private readonly config: Record<string, unknown>
	constructor() {
		// read the config file from bin and assign the JSON to the config property
		this.config = JSON.parse(fs.readFileSync('bin/config.json', 'utf8'))
	}

	/**
	 * Gets the path from the configuration object based on the provided key.
	 * If the path is not found in the configuration or is not a string, a warning is logged.
	 * Throws an error if the 'jarPath' is not defined or is not a string.
	 *
	 * @param path - The key used to retrieve the path from the configuration.
	 * @returns The path string if found in the configuration, otherwise an empty string.
	 */
	public getPath(path: 'coverImage' | 'hiddenFile' | 'jar' | 'stego'): string {
		// Create the configuration path by appending 'Path' to the provided key
		const configPath = `${path}Path`

		// Check if the path is 'jarPath' and if it's not defined or not a string, throw an error
		if (path === 'jar') {
			if (
				this.config[configPath] === undefined ||
				typeof this.config[configPath] !== 'string'
			) {
				throw new Error(
					'JarPath in config not set correctly. Please update your config to include the path to the OpenStego jar file',
				)
			}

			return typeof this.config[configPath] === 'string' &&
				this.config[configPath] === ''
				? 'bin/openstego.jar'
				: (this.config[configPath] as string)
		}

		// Check if the path exists in the configuration and is of type string
		if (
			this.config[configPath] === undefined ||
			typeof this.config[configPath] !== 'string'
		) {
			// Log a warning if the path is not found or is not a string
			console.warn(
				`${configPath} in config not set. For ease of repeated use, please update your config to include the path to your default Steganography file.`,
			)
		}

		// Return the path if it is a string, otherwise return an empty string
		return typeof this.config[configPath] === 'string'
			? (this.config[configPath] as string)
			: ''
	}
}
