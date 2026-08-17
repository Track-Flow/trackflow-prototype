import { createContext, useContext, useState } from 'react';
import { tfBoardCards, tfTickets } from '../data/mockData';

const TicketContext = createContext(null);

export function TicketProvider({ children }) {
  const [cards, setCards] = useState(
    tfBoardCards.map(c => ({ ...c, assignees: [...(c.assignees ?? [])] }))
  );

  // Merge card column (source of truth for status) into tfTickets
  const tickets = tfTickets.map(t => {
    const card = cards.find(c => c.id === t.id);
    return card ? { ...t, status: card.column } : t;
  });

  function moveCard(cardId, targetCol) {
    setCards(prev => prev.map(c => c.id === cardId ? { ...c, column: targetCol } : c));
  }

  function claimCard(cardId, tlaId) {
    setCards(prev => prev.map(c => c.id === cardId ? { ...c, assignees: [tlaId] } : c));
  }

  return (
    <TicketContext.Provider value={{ cards, setCards, tickets, moveCard, claimCard }}>
      {children}
    </TicketContext.Provider>
  );
}

export function useTickets() {
  return useContext(TicketContext);
}