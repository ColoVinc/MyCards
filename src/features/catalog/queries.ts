import { queryOptions } from '@tanstack/react-query'
import {
  getCatalogCardFn,
  getCatalogSetFn,
  getCollectionValueFn,
  getOwnedQuantitiesFn,
  getOwnedQuantityFn,
  listCatalogSetsFn,
  searchCatalogFn,
} from '#/features/catalog/server'
import type { CatalogGame } from '#/features/catalog/server'

export const catalogSetsQueryOptions = (game: CatalogGame) =>
  queryOptions({
    queryKey: ['catalog', 'sets', game],
    queryFn: () => listCatalogSetsFn({ data: game }),
    staleTime: 1000 * 60 * 60, // il catalogo cambia raramente
  })

export const catalogSetQueryOptions = (setId: string) =>
  queryOptions({
    queryKey: ['catalog', 'set', setId],
    queryFn: () => getCatalogSetFn({ data: setId }),
    staleTime: 1000 * 60 * 60,
  })

export const catalogCardQueryOptions = (catalogCardId: string) =>
  queryOptions({
    queryKey: ['catalog', 'card', catalogCardId],
    queryFn: () => getCatalogCardFn({ data: catalogCardId }),
    staleTime: 1000 * 60 * 60,
  })

export const ownedQuantitiesQueryOptions = (setId: string) =>
  queryOptions({
    queryKey: ['catalog', 'owned', 'set', setId],
    queryFn: () => getOwnedQuantitiesFn({ data: setId }),
  })

export const ownedQuantityQueryOptions = (catalogCardId: string) =>
  queryOptions({
    queryKey: ['catalog', 'owned', 'card', catalogCardId],
    queryFn: () => getOwnedQuantityFn({ data: catalogCardId }),
  })

export const catalogSearchQueryOptions = (query: string) =>
  queryOptions({
    queryKey: ['catalog', 'search', query],
    queryFn: () => searchCatalogFn({ data: query }),
    enabled: query.trim().length >= 2,
    staleTime: 1000 * 60 * 5,
  })

export const collectionValueQueryOptions = () =>
  queryOptions({
    queryKey: ['catalog', 'collection-value'],
    queryFn: () => getCollectionValueFn(),
    staleTime: 1000 * 60 * 60, // i prezzi cambiano ~una volta al giorno
  })
