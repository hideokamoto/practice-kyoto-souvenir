import { CaseReducer, createSlice } from '@reduxjs/toolkit';
import { createFeatureSelector } from '@ngrx/store';
import { Souvenir } from './souvenir.service';

type SouvenirState = {
    souvenirs: Souvenir[];
    items: Souvenir[];
};
const souvenirSlice = createSlice<SouvenirState, {
    setSouvenir: CaseReducer<SouvenirState, {
        type: string;
        payload: Souvenir[];
    }>;
    filterSouvenir: CaseReducer<SouvenirState, {
        type: string;
        payload: string;
    }>;
}>({
    name: 'souvenir',
    initialState: {
        souvenirs: [],
        items: [],
    },
    reducers: {
        setSouvenir: (state, action) => {
            state.items = action.payload;
            state.souvenirs = state.items;
        },
        filterSouvenir: (state, action) => {
            const name = action.payload;
            if (name) {
                state.items = state.souvenirs.filter(item => {
                    if (item.name) {
                        return item.name.includes(name)
                        || item.name_kana.includes(name);
                    }
                    return true;
                });
            } else {
                state.items = state.souvenirs;
            }
        }
    }
});

export const {
    reducer: souvenirReducer,
    actions: {
        setSouvenir,
        filterSouvenir,
    },
    name: souvenirFeatureKey
} = souvenirSlice;
export const selectSouvenirFeature = createFeatureSelector<SouvenirState>(souvenirFeatureKey);
