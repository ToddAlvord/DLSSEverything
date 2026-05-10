import React, { useState, useEffect } from "react";
import styled from "styled-components";

const FavoritesContainer = styled.div`
  margin: 0;
  font-size: 14px;
`;

const FavoritePill = styled.div<{ $selected: boolean }>`
  display: inline-flex;
  align-items: center;
  padding: 4px 12px;
  margin: 6px 1px 0px;
  background-color: ${({ $selected }) => ($selected ? "#52aa52" : "#3a3a3a")};
  border-radius: 20px;
  border: 1px solid #666;
  overflow: hidden;
  cursor: pointer;
`;

const FavoritePath = styled.span`
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const FavoriteButton = styled.button<{ $isFav: boolean }>`
  margin-left: 10px;
  background: none;
  border: none;
  border-radius: 50%;
  width: 25px;
  height: 25px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${({ $isFav }) => ($isFav ? "#ff5555" : "#18f004")};
  font-weight: bold;
  font-size: 16px;
  cursor: pointer;
  margin-right: -5px;
  &:hover {
    background-color: ${({ $isFav }) => ($isFav ? "rgba(255, 85, 85, 0.25)" : "transparent")};
  }
`;

interface FavoritesProps {
  currentlyViewedDirectory: string | null;
  onFavoriteClick: (path: string) => void;
  isLoading: boolean;
}

export function Favorites({ currentlyViewedDirectory, onFavoriteClick, isLoading }: FavoritesProps) {
  const [favorites, setFavorites] = useState<Set<string>>(new Set());

  useEffect(() => {
    const saved = localStorage.getItem("dlss-favorites");
    if (saved) {
      try {
        setFavorites(new Set(JSON.parse(saved)));
      } catch {
        // ignore parse errors
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("dlss-favorites", JSON.stringify(Array.from(favorites)));
  }, [favorites]);

  const toggleFavorite = (e: React.MouseEvent<HTMLButtonElement>, path: string) => {
    e.preventDefault();
    e.stopPropagation();
    setFavorites(prev => {
      const next = new Set(prev);
      if (next.has(path)) {
        if (!confirm(`Remove this favorite?\n${path}`)) return prev;
        next.delete(path);
      } else {
        next.add(path);
      }
      return next;
    });
  };

  const favs = [...favorites].map(f => ({
    path: f,
    type: "fav",
    selected: f === currentlyViewedDirectory,
  }));

  const currentIsFav = currentlyViewedDirectory && favs.find(d => d.path === currentlyViewedDirectory);
  if (!currentIsFav && currentlyViewedDirectory) {
    favs.push({ path: currentlyViewedDirectory, type: "current", selected: true });
  }

  if (favs.length === 0) return null;

  return (
    <FavoritesContainer>
      {favs.map(d => (
        <FavoritePill
          key={d.path}
          $selected={d.selected}
          onClick={() => !isLoading && onFavoriteClick(d.path)}
        >
          <FavoritePath>{d.path}</FavoritePath>
          <FavoriteButton
            $isFav={d.type === "fav"}
            onClick={(e: React.MouseEvent<HTMLButtonElement>) => toggleFavorite(e, d.path)}
          >
            {d.type === "fav" ? "\u00d7" : "+"}
          </FavoriteButton>
        </FavoritePill>
      ))}
    </FavoritesContainer>
  );
}
