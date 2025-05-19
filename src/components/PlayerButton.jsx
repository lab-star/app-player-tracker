import React from 'react';
import Button from 'react-bootstrap/Button';

export default function PlayerButton({ player, isActive, onToggle }) {
  return (
    <Button
      onClick={() => onToggle(player.id)}
      variant={isActive ? 'success' : 'outline-secondary'}
      style={{margin: "4px"}}
      className='w-100'
    >
      <h2>
        #{player.number}
      </h2>
      <div>
        {player.subject}
      </div>
    </Button>
  );
}
