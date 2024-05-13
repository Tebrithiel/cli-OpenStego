import enquirer from 'enquirer'
import { CLIInterface } from './cli-interface'

jest.mock('enquirer')

afterAll(() => {
	jest.clearAllMocks()
})

test('(Property) addCredential should return name and value', async () => {
	enquirer.prompt = jest
		.fn()
		.mockResolvedValueOnce({ name: 'secret name' })
		.mockResolvedValueOnce({ value: 'secret value' })

	const terminal = new CLIInterface()
	const response = await terminal.addCredential()

	expect(response.name).toBe('secret name')
	expect(response.value).toBe('secret value')
})

describe('(Property) editCredentials', () => {
	test('should return the edited credentials', async () => {
		enquirer.prompt = jest.fn().mockResolvedValueOnce({})

		const terminal = new CLIInterface()
		await terminal.editCredentials({
			secret: 'word',
			'another Secret': 'wonderful',
		})

		expect(enquirer.prompt).toHaveBeenCalledWith({
			choices: [
				{
					initial: 'word',
					message: 'secret',
					name: 'secret',
				},
				{
					initial: 'wonderful',
					message: 'another Secret',
					name: 'anotherSecret',
				},
			],
			message: 'Current Credentials:',
			name: 'editedCredentials',
			type: 'form',
		})
	})

	test('should display error messages and throw error', async () => {
		enquirer.prompt = jest.fn().mockResolvedValueOnce({})
		const error = jest.spyOn(console, 'error').mockImplementation(() => {})

		const terminal = new CLIInterface()

		expect(
			terminal.editCredentials({
				secret: ['word'],
				'another Secret': 9,
			}),
		).rejects.toThrow(Error)
		expect(error).toHaveBeenCalledTimes(1)
		expect(error).toHaveBeenCalledWith(
			'Credential',
			'secret',
			'is not typeof string. This program only supports embedding strings',
		)
	})
})

test('(Property) getStegoPassword should call the prompt function', async () => {
	enquirer.prompt = jest.fn().mockResolvedValueOnce({})

	const terminal = new CLIInterface()
	await terminal.getStegoPassword()

	expect(enquirer.prompt).toHaveBeenCalledTimes(1)
	expect(enquirer.prompt).toHaveBeenCalledWith({
		message: 'Please enter the password for your stego image:',
		name: 'stegoPassword',
		type: 'password',
	})
})
