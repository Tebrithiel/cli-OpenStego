import { ExecException, exec, execSync } from 'node:child_process'
import type { Config } from '../utils'

export class OpenStego {
	private readonly hiddenFilePath: string
	private readonly jarPath: string
	private readonly stegoPath: string

	constructor(config: Config) {
		this.hiddenFilePath = config.getPath('hiddenFile')
		this.jarPath = config.getPath('jar')
		this.stegoPath = config.getPath('stego')
	}

	/**
	 * decryptStego
	 */
	public decryptStego({
		stegoPath = this.stegoPath,
		stegoPassword,
		hiddenFilename = this.hiddenFilePath,
	}: { stegoPath?: string; stegoPassword?: string; hiddenFilename?: string }):
		| Record<string, unknown>
		| undefined {
		const extract = `java -jar ${this.jarPath} extract -sf ${stegoPath} -xd . -p ${stegoPassword}`
		const catFile = `cat ${hiddenFilename}`
		const clearFile = `rm ${hiddenFilename}`

		this.executeSyncCommand(extract)

		const output = this.executeSyncCommand(catFile)

		this.executeSyncCommand(clearFile)

		if (output === '') {
			console.warn('stego data was empty')
			return
		}

		try {
			return JSON.parse(output)
		} catch (error) {
			console.error('Output was not correctly structured as a JSON file')
			console.error(output)
			throw error
		}
	}

	private executeSyncCommand(command: string): string {
		try {
			return execSync(command, { encoding: 'utf8' })
		} catch (error: unknown) {
			if (error instanceof Error) {
				console.error(`Error executing command: ${command}`)
				console.error(error.toString())
				throw error
			}
			throw error
		}
	}
}
