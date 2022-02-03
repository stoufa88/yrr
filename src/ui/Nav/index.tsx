import {
  Box,
  Flex,
  Avatar,
  Button,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
} from "@chakra-ui/react";

interface Props {
  isSignedIn: boolean;
  imageUrl?: string;
  onSignin(): void;
  onSignout(): void;
}

export default function Nav({
  isSignedIn,
  imageUrl,
  onSignin,
  onSignout,
}: Props) {
  return (
        <Flex alignItems="center" justifyContent="space-between" h={16} bgColor="gray.800" px={4}>
          <Box textTransform="uppercase" fontWeight="bold" color="white">
            Stolenbeats
          </Box>

          {isSignedIn ? (
            <Menu>
              <MenuButton
                as={Button}
                rounded="full"
                variant="link"
                cursor="pointer"
                minW={0}
              >
                <Avatar size="sm" src={imageUrl} />
              </MenuButton>
              <MenuList>
                <MenuItem onClick={onSignout}>Signout</MenuItem>
              </MenuList>
            </Menu>
          ) : (
            <Button colorScheme="blue" onClick={onSignin}>
              Sign in
            </Button>
          )}
        </Flex>
  );
}
