import { queryOptions } from '@tanstack/react-query'
import { getCardFn, listCardsFn } from '#/features/cards/server'
import type { CardFilters } from '#/features/cards/validation'

export const cardsQueryOptions = (filters: CardFilters) =>
  queryOptions({
    queryKey: ['cards', 'list', filters],
    queryFn: () => listCardsFn({ data: filters }),
  })

export const cardQueryOptions = (cardId: string) =>
  queryOptions({
    queryKey: ['cards', 'detail', cardId],
    queryFn: () => getCardFn({ data: cardId }),
  })
