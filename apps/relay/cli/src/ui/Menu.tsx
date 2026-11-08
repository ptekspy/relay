import { Box, Text } from "ink";
import type React from "react";

export interface MenuItem {
  id: string;
  label: string;
  description: string;
}

interface MenuProps {
  items: MenuItem[];
  selectedIndex: number;
}

export const Menu: React.FC<MenuProps> = ({ items, selectedIndex }) => {
  return (
    <Box flexDirection="column" marginY={1}>
      {items.map((item, index) => {
        const isSelected = index === selectedIndex;
        return (
          <Box key={item.id} gap={1}>
            <Text color={isSelected ? "cyan" : "gray"}>
              {isSelected ? ">" : " "}
            </Text>
            <Text bold={isSelected} color={isSelected ? "white" : "gray"}>
              {item.label}
            </Text>
            <Text color="gray">— {item.description}</Text>
          </Box>
        );
      })}
    </Box>
  );
};
