import { CaseReducer, createSlice } from '@reduxjs/toolkit';
import { createFeatureSelector } from '@ngrx/store';
import { Sight } from './sights.service';

type SightsState = {
    sights: Sight[];
    items: Sight[];
};
const sightsSlice = createSlice<SightsState, {
    setSights: CaseReducer<SightsState, {
        type: string;
        payload: Sight[];
    }>;
    filterSights: CaseReducer<SightsState, {
        type: string;
        payload: string;
    }>;
}>({
    name: 'sight',
    initialState: {
        sights: [],
        items: [],
    },
    reducers: {
        setSights(state, action) {
            state.items = action.payload;
            state.sights = state.items;
        },
        filterSights(state, action) {
            const name = action.payload;
            if (name) {
                state.items = state.sights.filter(item => {
                    if (item.name) {
                        return item.name.includes(name)
                        || item.name_kana.includes(name);
                    }
                    return true;
                });
            } else {
                state.items = state.sights;
            }
        }
    }
});

export const {
    reducer: sightsReducer,
    actions: {
        setSights,
        filterSights,
    },
    name: sightsFeatureKey
} = sightsSlice;
export const selectSightsFeature = createFeatureSelector<SightsState>(sightsFeatureKey);
