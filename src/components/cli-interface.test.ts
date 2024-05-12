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

test('(Property) addCredential should return name and value', async () => {
	enquirer.prompt = jest
		.fn()
		.mockResolvedValueOnce({})

	const terminal = new CLIInterface()
	await terminal.editCredentials({ secret: 'word', 'another Secret': 'wonderful' })

	expect(enquirer.prompt).toHaveBeenCalledWith({
		choices: [{
			initial: "word",
			message: "secret",
			name: "secret",
		},
		{
			initial: "wonderful",
			message: "another Secret",
			name: "anotherSecret",
		},
	],
	message: "Current Credentials:",
	name: "editedCredentials",
	type: "form",})
})