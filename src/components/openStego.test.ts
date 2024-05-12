import child_process from 'node:child_process'
import { Config } from '../utils/config'
import { OpenStego } from './openStego'

jest.mock('../utils/config')
jest.mock('node:child_process')
const mockedChild_process = child_process as jest.Mocked<typeof child_process>

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

afterAll(() => {
	jest.resetAllMocks()
})

test('Config contructor should call config functions', () => {
	new OpenStego(config)
	expect(config.getPath).toHaveBeenCalledTimes(3)
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
