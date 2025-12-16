/** @jsxImportSource react */
import {
  Icon,
  IconButton,
  Input,
  InputGroup,
  InputGroupProps,
  InputLeftElement,
} from '@chakra-ui/react';
import { AiOutlineSearch as SearchIcon } from 'react-icons/ai';
import type { ChangeEvent } from 'react';

export function SearchBar(
  props: {
    value?: string;
    onChange?: (e: ChangeEvent<HTMLInputElement>) => void;
    onSearch?: () => void;
    placeholder?: string;
  } & InputGroupProps
) {
  const { value, onChange, onSearch, placeholder, ...rest } = props;

  return (
    <InputGroup {...rest}>
      <InputLeftElement>
        <IconButton
          aria-label="search"
          bg="inherit"
          borderRadius="inherit"
          _active={{}}
          variant="ghost"
          icon={
            <Icon
              as={SearchIcon}
              color="TextPrimary"
              width="15px"
              height="15px"
            />
          }
          onClick={onSearch}
        />
      </InputLeftElement>
      <Input
        fontSize="sm"
        bg="gray.100"
        color="TextPrimary"
        fontWeight="500"
        _placeholder={{ color: 'gray.400', fontSize: '14px' }}
        borderRadius="30px"
        placeholder={placeholder || 'Search...'}
        value={value}
        onChange={onChange}
        onKeyDown={(e) => {
          if (e.key === 'Enter') onSearch?.();
        }}
        _dark={{
          bg: 'night.900',
        }}
      />
    </InputGroup>
  );
}
