import {
  CHANNEL_VIEW,
  DID,
  MEMBER,
  NAME,
} from "../../constants/communityPredicates";
import EntryModel from "../../helpers/model";
import { EntryType, Entry, ChannelView } from "../../types";

export interface Member extends Entry {
  did: string;
}

class MemberModel extends EntryModel {
  static type = EntryType.Member;
  static properties = {
    did: {
      predicate: DID,
      type: String,
      resolve: false,
    },
  };

  async create(data: { did: string }): Promise<Entry> {
    return super.create(data);
  }

  async getAll() {
    return super.getAll() as Promise<Member[]>;
  }

  async get(id: string) {
    return super.get(id) as Promise<Member>;
  }
}

export default MemberModel;