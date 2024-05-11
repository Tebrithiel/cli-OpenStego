import { CLIInterface } from './components'

const testCredentials = {
	'1Password': 'qergoihqergQERGQAErgoih230987',
	'1Password Secret': 'awefg-saerg98234AGF',
	'Another secret encoded in stego': 'Secret_text',
}

async function main() {
	const terminal = new CLIInterface()

	const test = await terminal.addCredential()

	console.log(test)

	const edited = await terminal.editCredentials(testCredentials)

	console.log(edited)
}

main()
