import {
    Address,
    Account,
    beginCell,
    Cell,
    Contract,
    contractAddress,
    ContractProvider,
    Sender,
    SendMode,
    Dictionary
} from '@ton/core';
import { ClientAccountState } from 'ton-lite-client';

export type ProofCheckerConfig = {
};

export function proofCheckerConfigToCell(config: ProofCheckerConfig): Cell {
    return beginCell().endCell();
}

export class ProofChecker implements Contract {
    constructor(
        readonly address: Address,
        readonly init?: { code: Cell; data: Cell }
    ) {}

    static createFromAddress(address: Address) {
        return new ProofChecker(address);
    }

    static createFromConfig(config: ProofCheckerConfig, code: Cell, workchain = 0) {
        const data = proofCheckerConfigToCell(config);
        const init = { code, data };
        return new ProofChecker(contractAddress(workchain, init), init);
    }

    async sendDeploy(provider: ContractProvider, via: Sender, value: bigint) {
        await provider.internal(via, {
            value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell().endCell(),
        });
    }

    async sendCheckProof(
        provider: ContractProvider,
        via: Sender,
        value: bigint,
        opts: {
            rootHash: Buffer;
            blockProofer: Buffer;
            stateProofer: Account | null;
            accRawer: Buffer;
            accountState: ClientAccountState;
            shardProofer: Buffer;
        }
    ) {

        const body = beginCell()
            .storeBuffer(opts.rootHash, 256)
            .storeBuffer(opts.blockProofer)
            .storeDictDirect(opts.stateProofer)
            .storeBuffer(opts.accRawer)
            .store(opts.accountState)
            .storeBuffer(opts.shardProofer)
            .endCell();

        await provider.internal(via, {
            value: value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: body,
        });
    }

    async getAccountState(provider: ContractProvider): Promise<{active: boolean}> {
        const result = await provider.get('get_account_state', []);
        return {
            active: result.stack.readBoolean()
        };
    }
}
