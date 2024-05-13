import child_process from 'node:child_process'
import * as fs from 'node:fs'
import { Config } from '../utils/config'
import { OpenStego } from './openStego'

jest.mock('node:child_process')
jest.mock('node:fs')
jest.mock('../utils/config')

const mockedChild_process = child_process as jest.Mocked<typeof child_process>
const mockedFs = fs as jest.Mocked<typeof fs>

let config: Config
let openStego: OpenStego

beforeAll(() => {
	config = new Config()
	config.getPath = jest
		.fn()
		.mockImplementation(
			(path: 'coverImage' | 'hiddenFile' | 'jar' | 'stego') => {
				switch (path) {
					case 'coverImage':
						return 'coverImage/path'
					case 'hiddenFile':
						return 'hiddenFile/path'
					case 'jar':
						return 'jar/path'
					case 'stego':
						return 'stego/path'
					default:
						return ''
				}
			},
		)
	openStego = new OpenStego(config)
})

afterEach(() => {
	jest.resetAllMocks()
})

test('Config contructor should call config functions', () => {
	new OpenStego(config)
	expect(config.getPath).toHaveBeenCalledTimes(4)
})

describe('(Property) decryptStego', () => {
	test('should parse the recieved data and return the json', () => {
		const testSecrets = `{
			"1Password": "qergoihqergQERGQAErgoih230987",
			"1Password Secret": "awefg-saerg98234AGF",
			"Another secret encoded in stego": "Secret_text"
		}`
		mockedChild_process.execSync.mockReturnValue(testSecrets)

		const response = openStego.decryptStego({
			stegoPath: 'welp',
			stegoPassword: 'yello',
		})

		expect(mockedChild_process.execSync).toHaveBeenNthCalledWith(
			1,
			'java -jar jar/path extract -sf welp -xd . -p yello',
			{ encoding: 'utf8' },
		)
		expect(mockedChild_process.execSync).toHaveBeenNthCalledWith(
			2,
			'cat hiddenFile/path',
			{ encoding: 'utf8' },
		)
		expect(mockedChild_process.execSync).toHaveBeenNthCalledWith(
			3,
			'rm hiddenFile/path',
			{ encoding: 'utf8' },
		)
		expect(response).toStrictEqual(JSON.parse(testSecrets))
	})

	test('should return undefined and display warning when recieved data is an empty string', () => {
		mockedChild_process.execSync.mockReturnValue('')
		const warn = jest.spyOn(console, 'warn').mockImplementation(() => {})

		const response = openStego.decryptStego({})

		expect(warn).toHaveBeenCalledTimes(1)
		expect(warn).toHaveBeenCalledWith('stego data was empty')
		expect(response).toBeUndefined()
	})

	test('should throw error when recieved data is incorrectly structured for JSON', () => {
		const incorrectFormat = `{
			'test secret': 'this is wrong',
			'second secret': 'Still wrong'
		}`
		mockedChild_process.execSync.mockReturnValue(incorrectFormat)
		const error = jest.spyOn(console, 'error').mockImplementation(() => {})

		expect(() => openStego.decryptStego({})).toThrow()
		expect(error).toHaveBeenCalledTimes(2)
		expect(error).toHaveBeenNthCalledWith(
			1,
			'Output was not correctly structured as a JSON file',
		)
		expect(error).toHaveBeenNthCalledWith(2, incorrectFormat)
	})

	test('should throw error when execSync throws error', () => {
		const incorrectFormat = `{
			'test secret': 'this is wrong',
			'second secret': 'Still wrong'
		}`
		mockedChild_process.execSync
			.mockImplementationOnce(
				jest.fn(() => {
					throw new Error('Mocked error')
				}),
			)
			.mockImplementationOnce(
				jest.fn(() => {
					throw 'throwing random text'
				}),
			)
		const error = jest.spyOn(console, 'error').mockImplementation(() => {})

		expect(() => openStego.decryptStego({})).toThrow()
		expect(error).toHaveBeenCalledTimes(2)
		expect(error).toHaveBeenNthCalledWith(
			1,
			'Error executing command: java -jar jar/path extract -sf stego/path -xd . -p undefined',
		)
		expect(error).toHaveBeenNthCalledWith(2, 'Error: Mocked error')

		expect(() => openStego.decryptStego({})).toThrow('throwing random text')
	})
})

describe('(Property) updateStego', () => {
	const testSecrets =
		'{"1Password password":"b!bKDTYUKg6weftyR7*IwpwefWFExh2r*FdT","1Password SecretKey":"ag-erggh-y3456u-3hjne-23yjhd4-23ygd436-at3wy45"}'
	const info = jest.spyOn(console, 'info').mockImplementation(() => {})
	const error = jest.spyOn(console, 'error').mockImplementation(() => {})

	test('should parse the recieved data and call the execSync command', () => {
		mockedChild_process.execSync.mockImplementation(jest.fn())
		mockedFs.writeFileSync.mockImplementation(jest.fn())

		openStego.updateStego({
			updatedSecrets: JSON.parse(testSecrets),
			stegoPassword: 'welp',
		})

		expect(mockedFs.writeFileSync).toHaveBeenCalledTimes(1)
		expect(mockedFs.writeFileSync).toHaveBeenCalledWith(
			'hiddenFile/path/file.json',
			testSecrets,
		)
		expect(mockedChild_process.execSync).toHaveBeenCalledTimes(3)
		expect(mockedChild_process.execSync).toHaveBeenNthCalledWith(
			1,
			'mv stego/path/stego.bmp ./tmp/stegoOld.bmp',
			{ encoding: 'utf8' },
		)
		expect(mockedChild_process.execSync).toHaveBeenNthCalledWith(
			2,
			'java -jar jar/path/openstego.jar embed -mf hiddenFile/path/file.json -cf coverImage/path/image.jpg -sf stego/path/stego.bmp -e -A AES256 -p welp',
			{ encoding: 'utf8' },
		)
		expect(mockedChild_process.execSync).toHaveBeenNthCalledWith(
			3,
			'rm hiddenFile/path/file.json',
			{ encoding: 'utf8' },
		)
		expect(info).toHaveBeenCalledWith('Steganography file updated successfully')
	})

	test('should gracefully handle when WriteFileSync throws error', () => {
		mockedChild_process.execSync.mockImplementationOnce(jest.fn())
		mockedFs.writeFileSync.mockImplementation(
			jest.fn(() => {
				throw new Error('Failed writing file for some reason')
			}),
		)

		openStego.updateStego({ updatedSecrets: JSON.parse(testSecrets) })

		expect(mockedFs.writeFileSync).toHaveBeenCalledTimes(1)
		expect(mockedFs.writeFileSync).toHaveBeenCalledWith(
			'hiddenFile/path/file.json',
			testSecrets,
		)
		expect(mockedChild_process.execSync).not.toHaveBeenCalled()
		expect(error).toHaveBeenCalledTimes(2)
		expect(error).toHaveBeenNthCalledWith(
			1,
			'Failed to write secrets to temporary Hidden file',
		)
		expect(error).toHaveBeenNthCalledWith(
			2,
			Error('Failed writing file for some reason'),
		)
	})

	test('should display error when backup command throws error', () => {
		mockedChild_process.execSync.mockImplementationOnce(
			jest.fn(() => {
				throw new Error('Command failed')
			}),
		)
		mockedFs.writeFileSync.mockImplementation(jest.fn())

		expect(() =>
			openStego.updateStego({ updatedSecrets: JSON.parse(testSecrets) }),
		).toThrow(Error('Command failed'))

		expect(mockedFs.writeFileSync).toHaveBeenCalled()
		expect(mockedChild_process.execSync).toHaveBeenCalledTimes(1)
		expect(mockedChild_process.execSync).toHaveBeenCalledWith(
			'mv stego/path/stego.bmp ./tmp/stegoOld.bmp',
			{ encoding: 'utf8' },
		)
		expect(error).toHaveBeenCalledTimes(3)
		expect(error).toHaveBeenNthCalledWith(
			1,
			'Error executing command: mv stego/path/stego.bmp ./tmp/stegoOld.bmp',
		)
		expect(error).toHaveBeenNthCalledWith(2, 'Error: Command failed')
		expect(error).toHaveBeenNthCalledWith(
			3,
			'Failed to backup stego File. Please check if you stego file exists',
		)
	})

	test('should display error and restore backup stego when embed command throws error', () => {
		mockedChild_process.execSync
			.mockImplementationOnce(jest.fn()) // pass backup command
			.mockImplementationOnce(
				jest.fn(() => {
					throw new Error('Embed failed')
				}),
			)
			.mockImplementationOnce(jest.fn()) // pass restore command
		mockedFs.writeFileSync.mockImplementation(jest.fn())

		expect(() =>
			openStego.updateStego({ updatedSecrets: JSON.parse(testSecrets) }),
		).toThrow(Error('Embed failed'))

		expect(mockedFs.writeFileSync).toHaveBeenCalled()
		expect(mockedChild_process.execSync).toHaveBeenCalledTimes(3)
		expect(mockedChild_process.execSync).toHaveBeenNthCalledWith(
			3,
			'mv ./tmp/stegoOld.bpm stego/path/stego.bmp',
			{ encoding: 'utf8' },
		)
		expect(error).toHaveBeenCalledTimes(3)
		expect(error).toHaveBeenNthCalledWith(
			1,
			'Error executing command: java -jar jar/path/openstego.jar embed -mf hiddenFile/path/file.json -cf coverImage/path/image.jpg -sf stego/path/stego.bmp',
		)
		expect(error).toHaveBeenNthCalledWith(2, 'Error: Embed failed')
		expect(error).toHaveBeenNthCalledWith(
			3,
			'Failed to embed updated secrets. Restoring backup. Please review the error message below',
		)
	})

	test('should display errors when embed and restore commands throw errors', () => {
		mockedChild_process.execSync
			.mockImplementationOnce(jest.fn()) // pass backup command
			.mockImplementationOnce(
				jest.fn(() => {
					throw new Error('Embed failed')
				}),
			)
			.mockImplementationOnce(
				jest.fn(() => {
					throw Error('Restore failed')
				}),
			)
		mockedFs.writeFileSync.mockImplementation(jest.fn())

		expect(() =>
			openStego.updateStego({ updatedSecrets: JSON.parse(testSecrets) }),
		).toThrow(Error('Embed failed'))

		expect(mockedFs.writeFileSync).toHaveBeenCalled()
		expect(mockedChild_process.execSync).toHaveBeenCalledTimes(3)
		expect(mockedChild_process.execSync).toHaveBeenNthCalledWith(
			3,
			'mv ./tmp/stegoOld.bpm stego/path/stego.bmp',
			{ encoding: 'utf8' },
		)
		expect(error).toHaveBeenCalledTimes(6)
		expect(error).toHaveBeenNthCalledWith(
			4,
			'Error executing command: mv ./tmp/stegoOld.bpm stego/path/stego.bmp',
		)
		expect(error).toHaveBeenNthCalledWith(5, 'Error: Restore failed')
		expect(error).toHaveBeenNthCalledWith(
			6,
			'Panic!!! Failed to restore backup of Stego file. You should be able to find the file in',
			'/home/tebrithiel/cli-OpenStego/cli-OpenStego/tmp/stegoOld.bmp',
		)
	})

	test('should display errors when cleanFile command throws error', () => {
		mockedChild_process.execSync
			.mockImplementationOnce(jest.fn()) // pass backup command
			.mockImplementationOnce(jest.fn()) // pass embed command
			.mockImplementationOnce(
				jest.fn(() => {
					throw Error('CleanFile failed')
				}),
			)
		mockedFs.writeFileSync.mockImplementation(jest.fn())

		openStego.updateStego({ updatedSecrets: JSON.parse(testSecrets) })

		expect(mockedFs.writeFileSync).toHaveBeenCalled()
		expect(mockedChild_process.execSync).toHaveBeenCalledTimes(3)
		expect(mockedChild_process.execSync).toHaveBeenNthCalledWith(
			3,
			'rm hiddenFile/path/file.json',
			{ encoding: 'utf8' },
		)
		expect(error).toHaveBeenCalledTimes(3)
		expect(error).toHaveBeenNthCalledWith(
			1,
			'Error executing command: rm hiddenFile/path/file.json',
		)
		expect(error).toHaveBeenNthCalledWith(2, 'Error: CleanFile failed')
		expect(error).toHaveBeenNthCalledWith(
			3,
			'Failed to clean up the hidden file. For security purposes please manually delete the file located here: hiddenFile/path/file.json',
		)
	})
})
