import { execSync } from 'node:child_process'
import { writeFileSync } from 'node:fs'
import type { Config } from '../utils'

export class OpenStego {
	private readonly coverImagePath: string
	private readonly hiddenFilePath: string
	private readonly jarPath: string
	private readonly stegoPath: string

	constructor(config: Config) {
		this.coverImagePath = config.getPath('coverImage')
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
		hiddenFilePath = this.hiddenFilePath,
	}: { stegoPath?: string; stegoPassword?: string; hiddenFilePath?: string }):
		| Record<string, unknown>
		| undefined {
		const extract = `java -jar ${
			this.jarPath
		} extract -sf ${stegoPath} -xd ${hiddenFilePath.substring(
			0,
			hiddenFilePath.lastIndexOf('/'),
		)}${stegoPassword ? ` -p ${stegoPassword}` : ''}`
		const catFile = `cat ${hiddenFilePath}`
		const clearFile = `rm ${hiddenFilePath}`

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

	/**
	 * updateStego
	 */
	public updateStego({
		updatedSecrets,
		coverImagePath = this.coverImagePath,
		hiddenFilePath = this.hiddenFilePath,
		stegoPath = this.stegoPath,
		stegoPassword,
	}: {
		updatedSecrets: Record<string, unknown>
		coverImagePath?: string
		hiddenFilePath?: string
		stegoPath?: string
		stegoPassword?: string
	}): void {
		const embed = `java -jar ${
			this.jarPath
		} embed -mf ${hiddenFilePath} -cf ${coverImagePath} -sf ${stegoPath}${
			stegoPassword ? ` -e -A AES256 -p ${stegoPassword}` : ''
		}`
		const clearFile = `rm ${hiddenFilePath}`
		const tempSaveOldStego = `mv ${stegoPath} ./tmp/stegoOld.bmp`
		const restoreOldStego = `mv ./tmp/stegoOld.bpm ${stegoPath}`

		try {
			writeFileSync(hiddenFilePath, JSON.stringify(updatedSecrets))
		} catch (error) {
			console.error('Failed to write secrets to temporary Hidden file')
			console.error(error)
			return
		}

		try {
			this.executeSyncCommand(tempSaveOldStego)
		} catch (error) {
			console.error(
				'Failed to backup stego File. Please check if you stego file exists',
			)
			throw error
		}

		try {
			this.executeSyncCommand(embed)
		} catch (error) {
			console.error(
				'Failed to embed updated secrets. Restoring backup. Please review the error message below',
			)
			try {
				this.executeSyncCommand(restoreOldStego)
			} catch (error) {
				console.error(
					'Panic!!! Failed to restore backup of Stego file. You should be able to find the file in',
					`${process.cwd()}/tmp/stegoOld.bmp`,
				)
			}
			throw error
		}

		try {
			this.executeSyncCommand(clearFile)
		} catch (error) {
			console.error(
				`Failed to clean up the hidden file. For security purposes please manually delete the file located here: ${hiddenFilePath}`,
			)
		}

		console.info('Steganography file updated successfully')
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
