import * as fs from 'node:fs'
import { Config } from './config'

jest.mock('node:fs')
const mockedFs = fs as jest.Mocked<typeof fs>

afterEach(() => {
	jest.resetAllMocks()
})

describe('(Property) getPath', () => {
	test('should return the jarPath when jarPath is configured', () => {
		mockedFs.readFileSync.mockReturnValueOnce(
			JSON.stringify({ jarPath: 'jar/path' }),
		)

		const config = new Config()

		expect(mockedFs.readFileSync).toHaveBeenCalledWith(
			'bin/config.json',
			'utf8',
		)
		expect(config.getPath('jar')).toBe('jar/path')
	})

	test('should return the default jarPath when jarPath is empty', () => {
		mockedFs.readFileSync.mockReturnValueOnce(JSON.stringify({ jarPath: '' }))

		const config = new Config()

		expect(mockedFs.readFileSync).toHaveBeenCalledWith(
			'bin/config.json',
			'utf8',
		)
		expect(config.getPath('jar')).toBe('bin/openstego.jar')
	})

	test('should throw error when jarPath is anything other than a string', () => {
		const badPathTypes = [undefined, 9, null]

		for (const pathType of badPathTypes) {
			mockedFs.readFileSync.mockReturnValueOnce(
				JSON.stringify({ jarPath: pathType }),
			)

			const config = new Config()

			expect(() => config.getPath('jar')).toThrow(Error)
		}
	})

	test('should return the requested Path when the requested Path is configured', () => {
		mockedFs.readFileSync.mockReturnValueOnce(
			JSON.stringify({ stegoPath: 'stego/path' }),
		)

		const config = new Config()

		expect(mockedFs.readFileSync).toHaveBeenCalledWith(
			'bin/config.json',
			'utf8',
		)
		expect(config.getPath('stego')).toBe('stego/path')
	})

	test('should display warning when the requested Path is not a string and return empty string', () => {
		const warn = jest.spyOn(console, 'warn').mockImplementation(() => {})
		const badPathTypes = [undefined, 9, null]

		for (const pathType of badPathTypes) {
			mockedFs.readFileSync.mockReturnValueOnce(
				JSON.stringify({ stegoPath: pathType }),
			)

			const config = new Config()

			config.getPath('stego')

			expect(warn).toHaveBeenCalled()
			expect(warn).toHaveBeenCalledWith(
				'stegoPath in config not set. For ease of repeated use, please update your config to include the path to your default Steganography file.',
			)
			expect(config.getPath('stego')).toBe('')
		}
	})
})
