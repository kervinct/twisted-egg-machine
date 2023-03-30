from datetime import datetime

from solana.rpc.api import Client
from solana.publickey import PublicKey
from spl.token.instructions import get_associated_token_address
from base64 import b64decode, b64encode
from base58 import b58decode, b58encode
from construct import RepeatUntil, Struct, BytesInteger, Bytes, Adapter, this, PascalString, Array
from construct import setGlobalPrintFullStrings


setGlobalPrintFullStrings(True)
# client = Client("https://api.mainnet-beta.solana.com")
client = Client("https://api.devnet.solana.com")
# client = Client("http://127.0.0.1:8899")
program_id = PublicKey("2Y3mNd1XnyJNUUg4UksmQNgzL4DxWzPz4yS29VrBAVuE")

class PubkeyAdapter(Adapter):
    def _decode(self, obj, context, path):
        return PublicKey(obj)
    def _encode(self, obj, context, path):
        return bytes(obj)

class AwardTypeAdapter(Adapter):
    def _decode(self, obj, context, path):
        if obj == 0:
            return "Award"
        elif obj == 1:
            return "Fragment"
        else:
            return "Unknown"
    def _encode(self, obj, context, path):
        if obj == "Award":
            return bytes(0)
        elif obj == "Fragment":
            return bytes(1)
        else:
            raise TypeError("Unknown award type")

class TimestampAdapter(Adapter):
    def _decode(self, obj, context, path):
        return datetime.fromtimestamp(obj)
    def _encode(self, obj, context, path):
        return obj.timestamp()


class MachineStatusAdapter(Adapter):
    def _decode(self, obj, context, path):
        if obj == 0:
            return "UnInitialized"
        elif obj == 1:
            return "Initialized"
        elif obj == 2:
            return "Activated"
        elif obj == 3:
            return "Stopped"
        else:
            return "Unknown"


award_schema = Struct(
    "amount" / BytesInteger(8, swapped=True),
    "quota" / BytesInteger(2, swapped=True),
    "rate_numerator" / BytesInteger(2, swapped=True),
    Bytes(4),
)
awards_schema = Struct(
    "awards" / Array(100, award_schema),
    "index" / BytesInteger(1),
    Bytes(7),
)
class AwardsAdapter(Adapter):
    def _decode(self, obj, context, path):
        data = awards_schema.parse(obj)
        return [data.awards[i] for i in range(data.index)]

fragment_schema = Struct(
    "id" / BytesInteger(8, swapped=True),
    "quota" / BytesInteger(2, swapped=True),
    "limit" / BytesInteger(2, swapped=True),
    Bytes(4),
)
fragments_schema = Struct(
    "fragments" / Array(30, fragment_schema),
    "index" / BytesInteger(1),
    Bytes(7),
)
class FragmentsAdapter(Adapter):
    def _decode(self, obj, context, path):
        data = fragments_schema.parse(obj)
        return [data.fragments[i] for i in range(data.index)]

machine_account_schema = Struct(
    Bytes(8),
    "nonce" / BytesInteger(1),
    "status" / MachineStatusAdapter(BytesInteger(1)),
    "default_limit" / BytesInteger(2, swapped=True),
    Bytes(4),
    "rand_seed" / BytesInteger(8, swapped=True),
    "machine_id" / BytesInteger(8, swapped=True),
    "price" / BytesInteger(8, swapped=True),
    "filling_fragment_id" / BytesInteger(8, swapped=True),
    "activate_at" / TimestampAdapter(BytesInteger(8, signed=True, swapped=True)),
    "stop_at" / TimestampAdapter(BytesInteger(8, signed=True, swapped=True)),
    "beneficiary" / PubkeyAdapter(Bytes(32)),
    "mint" / PubkeyAdapter(Bytes(32)),
    "authority" / PubkeyAdapter(Bytes(32)),
    "awards" / AwardsAdapter(Bytes(1608)),
    "fragments" / FragmentsAdapter(Bytes(488)),
)

def data_to_machine_account(resp):
    awards = ""
    for award in resp.awards:
        awards += f"\n  amount: {award.amount}\n  quota: {award.quota}\n  rate_numerator: {award.rate_numerator}\n"
    awards = awards.rstrip()
    fragments = ""
    for fragment in resp.fragments:
        fragments += f"\n  id: {fragment.id}\n  quota: {fragment.quota}\n  limit: {fragment.limit}\n"
    fragments = fragments.rstrip()
    return f"""nonce: {resp.nonce}
status: {resp.status}
rand_seed: {resp.rand_seed}
machine_id: {resp.machine_id}
price: {resp.price}
filling_fragment_id: {resp.filling_fragment_id}
activate_at: {resp.activate_at}
stop_at: {resp.stop_at}
beneficiary: {resp.beneficiary}
mint: {resp.mint}
authority: {resp.authority}
awards: {awards}
fragments: {fragments}
"""

lottery_event_schema = Struct(
    Bytes(8),
    "winner" / PubkeyAdapter(Bytes(32)),
    "id" / BytesInteger(8, swapped=True),
    "award_type" / AwardTypeAdapter(BytesInteger(1)),
    "label" / PascalString(BytesInteger(4, swapped=True), "utf8"),
)

"""
machine_id: u64,
nonce: u8,
rand_seed: u64,
price: u64,
filling_fragment_id: Option<u64>,
"""

create_machine_schema = Struct(
    Bytes(8),
    "machine_id" / BytesInteger(8, swapped=True),
    "nonce" / BytesInteger(1),
    "rand_seed" / BytesInteger(8, swapped=True),
    "price" / BytesInteger(8, swapped=True),
    "default_limit" / BytesInteger(2, swapped=True),
    "filling_fragment_id" / BytesInteger(8, swapped=True),
)

"""
award_id: u8,
award: Award,
    amount: u64,
    quota: u16,
    rate: u16,
    padding: [u8; 4],
"""

add_award_schema = Struct(
    Bytes(8),
    "award_id" / BytesInteger(1),
    "award" / Struct(
        "amount" / BytesInteger(8, swapped=True),
        "quota" / BytesInteger(2, swapped=True),
        "rate" / BytesInteger(2, swapped=True),
        Bytes(4),
    ),
)

def parse_event(event):
    return lottery_event_schema.parse(b64decode(event))

def parse_machine_account(machine: PublicKey):
    resp = client.get_account_info(machine, encoding="jsonParsed")
    if resp['result']['value'] == None:
        return f"Account {machine} doesn't exist"
    data = resp['result']['value']['data'][0]
    print(data)
    return machine_account_schema.parse(b64decode(data))

def main():

    # dev
    # print(parse_pool(dev))
    event = """
    Vyn9nhzUDCI/23CA3lJDtpJKmyNF2Gkq+sYat3wd3R73CoiOxzO2XgAAAAAAAAAAAQgAAABGcmFnbWVudA==
    """
    event = """
    Vyn9nhzUDCKUYQFBqLic1TCT5CFvQyinOB/VnXGaOdzloXurOfxfJgEAAAAAAAAAAAUAAABBd2FyZA==
    """
    # print(parse_event(event.strip()))

    print(parse_machine_account("HNGzEEK21dC41rqCdMVWwfbVDqa65PZNoLVdJNtM6bAo"))

    # print(create_machine_schema.parse(bytes.fromhex("a3b842cda445a3900200000000000000fe4600000000000000e80300000000000000")))
    # print(add_award_schema.parse(bytes.fromhex("f42a5bf0be08f2c00000e1f505000000001400000000000000320000000000000000000000")))
    # print(add_award_schema.parse(bytes.fromhex("f42a5bf0be08f2c00100e1f505000000001400000000000000320000000000000000000000")))

    data = """
    clqca2uubED+AgAAAAAAAB0yaL1HVwUOAgAAAAAAAADoAwAAAAAAAAAAAAAAAAAA++JCYgAAAABxHUxiAAAAAMTpCofy+wA0AMZ7p2TfEnrbKW6kbHp5zmm4Ffzuw95zBpuIV/6rgYT7aH9jRhjANdrEOdwa6ztVmKDwAAAAAAHE6QqH8vsANADGe6dk3xJ62ylupGx6ec5puBX87sPecwDh9QUAAAAAFAAAAAAAAAAA4fUFAAAAABQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACAAAAAAAAAAAAAAAAAAAAzP8KAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAEAAAAAAAAA
    """
    # data = b64decode(data)
    # print(data_to_machine_account(machine_account_schema.parse(data)))


if __name__ == "__main__":
    main()