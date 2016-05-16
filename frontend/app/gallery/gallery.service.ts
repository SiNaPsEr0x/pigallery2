///<reference path="../../browser.d.ts"/>

import {Injectable} from "@angular/core";
import {NetworkService} from "../model/network/network.service.ts";
import {Message} from "../../../common/entities/Message";
import {ContentWrapper} from "../../../common/entities/ConentWrapper";
import {Photo} from "../../../common/entities/Photo";
import {Directory} from "../../../common/entities/Directory";
import {SearchTypes} from "../../../common/entities/AutoCompleteItem";

@Injectable()
export class GalleryService {

    public content:ContentWrapper;
    private lastDirectory:Directory;
    private searchId:any;

    constructor(private _networkService:NetworkService) {
        this.content = new ContentWrapper();
    }

    public getDirectory(directoryName:string):Promise<Message<ContentWrapper>> {
        return this._networkService.getJson("/gallery/content/" + directoryName).then(
            (message:Message<ContentWrapper>) => {
                if (!message.error && message.result) {
                    message.result.directory.photos.forEach((photo:Photo) => {
                        photo.directory = message.result.directory;
                    });
                    this.lastDirectory = message.result.directory;
                    this.content = message.result;
                }
                return message;
            });
    }

    //TODO: cache
    public search(text:string, type?:SearchTypes):Promise<Message<ContentWrapper>> {
        clearTimeout(this.searchId);
        if (text === null || text === '') {
            return Promise.resolve(new Message(null, null));
        }

        let queryString = "/gallery/search/" + text;
        if (type) {
            queryString += "?type=" + type;
        }

        return this._networkService.getJson(queryString).then(
            (message:Message<ContentWrapper>) => {
                if (!message.error && message.result) {
                    this.content = message.result;
                }
                return message;
            });
    }

    //TODO: cache (together with normal search)
    public instantSearch(text:string):Promise<Message<ContentWrapper>> {
        if (text === null || text === '') {
            this.content.directory = this.lastDirectory;
            this.content.searchResult = null;
            clearTimeout(this.searchId);
            return Promise.resolve(new Message(null, null));
        }

        if (this.searchId != null) {
            clearTimeout(this.searchId);

        }
        this.searchId = setTimeout(() => {
            this.search(text);
            this.searchId = null;
        }, 3000); //TODO: set timeout to config

        return this._networkService.getJson("/gallery/instant-search/" + text).then(
            (message:Message<ContentWrapper>) => {
                if (!message.error && message.result) {
                    this.content = message.result;
                }
                return message;
            });

    }

}
