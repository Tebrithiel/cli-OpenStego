import { prompt } from 'enquirer'
import camelCase from 'lodash.camelcase'

interface iCredentialFormInput {
	name: string
	message: string
	initial: string
}

interface iCredential {
	name: string
	value: string
}

interface iStegoPassword {
	stegoPassword: string
}

export class CLIInterface {
	public async addCredential(): Promise<iCredential> {
		const credentialName: Record<string, string> = await prompt({
			name: 'name',
			type: 'input',
			message: "What is the secret's name?",
		})
		const credentialValue: Record<string, string> = await prompt({
			name: 'value',
			type: 'input',
			message: "What is the secret's value?",
		})

		return { name: credentialName.name, value: credentialValue.value }
	}

	public async editCredentials(
		currentCredentials: Record<string, unknown>,
	): Promise<Record<string, Record<string, unknown>>> {
		const mappedCredentials: iCredentialFormInput[] = Object.entries(
			currentCredentials,
		).map(credential => {
			if (typeof credential[1] !== 'string') {
				console.error(
					'Credential',
					credential[0],
					'is not typeof string. This program only supports embedding strings',
				)
				throw new Error('Credential is not string')
			}
			const credentialFullName = credential[0]
			const credentialValue = credential[1]
			const credentialCodeName = camelCase(credentialFullName)

			return {
				name: credentialCodeName,
				message: credentialFullName,
				initial: credentialValue,
			}
		})

		return prompt({
			name: 'editedCredentials',
			message: 'Current Credentials:',
			type: 'form',
			choices: mappedCredentials,
		})
	}

	public async getStegoPassword(): Promise<iStegoPassword> {
		return prompt({
			type: 'password',
			name: 'stegoPassword',
			message: 'Please enter the password for your stego image:',
		})
	}
}
