/** @jsxImportSource react */
import {
  Avatar,
  Flex,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  Text,
  useColorModeValue,
} from '@chakra-ui/react';
import { avatarUrl } from '@/api/discord';
import { useSelfUserQuery } from '@/api/hooks';

export function UserMenu() {
  const { data: user } = useSelfUserQuery();

  if (!user) return null;

  return (
    <Menu>
      <MenuButton p="0px">
        <Avatar
          _hover={{ cursor: 'pointer' }}
          color="white"
          name={user.username}
          src={avatarUrl(user)}
          bg="brand.400"
          w="40px"
          h="40px"
        />
      </MenuButton>
      <UserMenuList user={user} />
    </Menu>
  );
}

function UserMenuList({
  user,
}: {
  user: { username: string; global_name?: string };
}) {
  const menuBg = useColorModeValue('white', 'night.800');
  const textColor = useColorModeValue('gray.900', 'white');
  const borderColor = useColorModeValue('#E6ECFA', 'rgba(135, 140, 189, 0.3)');

  const handleLogout = () => {
    // Redirect to logout endpoint
    window.location.href = '/api/auth/logout';
  };

  return (
    <MenuList
      boxShadow="normal"
      p="0px"
      mt="10px"
      borderRadius="20px"
      bg={menuBg}
      border="none"
    >
      <Flex w="100%" mb="0px">
        <Text
          ps="20px"
          pt="16px"
          pb="10px"
          w="100%"
          borderBottom="1px solid"
          borderColor={borderColor}
          fontSize="sm"
          fontWeight="700"
          color={textColor}
        >
          <span aria-label="Hi" role="img">
            👋
          </span>
          &nbsp; Hey, {user.global_name || user.username}
        </Text>
      </Flex>
      <Flex flexDirection="column" p="10px">
        <MenuItem
          _hover={{ bg: 'whiteAlpha.100' }}
          _focus={{ bg: 'none' }}
          borderRadius="8px"
          px="14px"
          as="a"
          href="/dash/profile"
        >
          <Text fontSize="sm">Profile</Text>
        </MenuItem>
        <MenuItem
          _hover={{ bg: 'whiteAlpha.100' }}
          _focus={{ bg: 'none' }}
          color="red.400"
          borderRadius="8px"
          onClick={handleLogout}
          px="14px"
        >
          <Text fontSize="sm">Logout</Text>
        </MenuItem>
      </Flex>
    </MenuList>
  );
}
